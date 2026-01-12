// src/controllers/exercise.controller.js
import mongoose from "mongoose";
import Exercise from "../models/Exercise.js";
import SavedExercise from "../models/SavedExercise.js";
import Comment from "../models/Comment.js";
import Solution from "../models/Solution.js";
import Activity from "../models/Activity.js";


/* =========================
   Helpers
   ========================= */
const getUserId = (req) => req.user?._id || req.user?.id;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const mapAttachmentsFromFiles = (files = []) => {
  return files.map((f) => ({
    url: f.path,
    publicId: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
  }));
};

/* =========================
   EXERCISES
   ========================= */

/**
 * POST /api/exercises (🔒)
 * Criar novo exercício (ficheiros opcionais)
 */
export const createExercise = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description, subject, difficulty } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!title || !description || !subject || !difficulty) {
      return res.status(400).json({
        message: "Title, description, subject and difficulty are required",
      });
    }

    const attachments = mapAttachmentsFromFiles(req.files || []);

    const exercise = await Exercise.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      difficulty: difficulty.trim(),
      attachments,
      createdBy: userId,
    });

    await exercise.populate("createdBy", "name email");

    /* =====================================================
       👉 A PARTIR DAQUI É O QUE TENS DE ADICIONAR
       ===================================================== */

    // 1️⃣ Criar atividade na BD
    const activity = await Activity.create({
      type: "exercise_created",
      actor: userId,
      exercise: exercise._id,
      message: "created an exercise",

    });

    // 2️⃣ Emitir em tempo real (Socket.IO)
    const io = req.app.get("io");
    if (io) {
      const populatedActivity = await Activity.findById(activity._id)
        .populate("actor", "name email")
        .populate("exercise", "title subject difficulty createdAt");

      io.emit("activity:new", populatedActivity);
    }

    /* ===================================================== */

    return res.status(201).json({
      ...exercise.toObject(),
      savesCount: 0,
      commentsCount: 0,
      solutionsCount: 0,
    });
  } catch (error) {
    console.error("CREATE EXERCISE ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to create exercise",
    });
  }
};


/**
 * GET /api/exercises
 * Pesquisa + filtros + counts reais
 */
export const getExercises = async (req, res) => {
  try {
    const { search, subject, difficulty } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    if (subject && subject !== "All") {
      query.subject = subject;
    }

    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }

    const exercises = await Exercise.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const exercisesWithCounts = await Promise.all(
      exercises.map(async (ex) => {
        const [savesCount, commentsCount, solutionsCount] = await Promise.all([
          SavedExercise.countDocuments({ exercise: ex._id }),
          Comment.countDocuments({ exercise: ex._id }),
          Solution.countDocuments({ exercise: ex._id }),
        ]);

        return {
          ...ex.toObject(),
          savesCount,
          commentsCount,
          solutionsCount,
        };
      })
    );

    return res.status(200).json(exercisesWithCounts);
  } catch (error) {
    console.error("GET EXERCISES ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch exercises",
    });
  }
};

/**
 * GET /api/exercises/:id
 * Obter exercício individual + counts reais
 */
export const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    const [savesCount, commentsCount, solutionsCount] = await Promise.all([
      SavedExercise.countDocuments({ exercise: exercise._id }),
      Comment.countDocuments({ exercise: exercise._id }),
      Solution.countDocuments({ exercise: exercise._id }),
    ]);

    return res.status(200).json({
      ...exercise.toObject(),
      savesCount,
      commentsCount,
      solutionsCount,
    });
  } catch (error) {
    console.error("GET EXERCISE BY ID ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch exercise",
    });
  }
};

/* =========================
   SAVED / BOOKMARK
   ========================= */

/**
 * POST /api/exercises/:id/save-toggle (🔒)
 * Toggle guardar/desguardar
 */
export const toggleSaveExercise = async (req, res) => {
  const userId = getUserId(req);
  const { id: exerciseId } = req.params;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const existing = await SavedExercise.findOne({
      user: userId,
      exercise: exerciseId,
    });

    if (existing) {
      await existing.deleteOne();
    } else {
      await SavedExercise.create({ user: userId, exercise: exerciseId });
    }

    const savesCount = await SavedExercise.countDocuments({
      exercise: exerciseId,
    });

    return res.json({
      saved: !existing,
      savesCount,
    });
  } catch (err) {
    console.error("TOGGLE SAVE ERROR:", err);
    return res.status(500).json({ message: "Erro ao guardar exercício" });
  }
};

/**
 * GET /api/exercises/:id/is-saved (🔒)
 * Saber se user já guardou
 */
export const isExerciseSaved = async (req, res) => {
  const userId = getUserId(req);
  const { id: exerciseId } = req.params;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const saved = await SavedExercise.exists({
      user: userId,
      exercise: exerciseId,
    });

    return res.json({ saved: !!saved });
  } catch (err) {
    console.error("IS SAVED ERROR:", err);
    return res.status(500).json({ message: "Erro ao verificar save" });
  }
};

/* =========================
   COMMENTS
   ========================= */

/**
 * GET /api/exercises/:id/comments
 * Listar comentários
 */
export const getExerciseComments = async (req, res) => {
  const { id: exerciseId } = req.params;

  try {
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const comments = await Comment.find({ exercise: exerciseId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    return res.status(500).json({ message: "Erro ao buscar comentários" });
  }
};

/**
 * POST /api/exercises/:id/comments (🔒)
 * Criar comentário (texto e/ou files[])
 * - Requer pelo menos text OU files
 */
export const createExerciseComment = async (req, res) => {
  const userId = getUserId(req);
  const { id: exerciseId } = req.params;
  const { text } = req.body;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const attachments = mapAttachmentsFromFiles(req.files || []);

    if ((!text || !text.trim()) && attachments.length === 0) {
      return res
        .status(400)
        .json({ message: "Comment must have text or files" });
    }

    const comment = await Comment.create({
      exercise: exerciseId,
      user: userId,
      text: text?.trim() || "",
      attachments,
    });

    await comment.populate("user", "name");
    
    // ✅ activity: comment
    const activity = await Activity.create({
      type: "comment_added",
      actor: userId,
      exercise: exerciseId,
      comment: comment._id,
      message: `commented on`,
    });

    const io = req.app.get("io");
    if (io) {
      const populatedActivity = await Activity.findById(activity._id)
        .populate("actor", "name email")
        .populate("exercise", "title subject difficulty createdAt");

      io.emit("activity:new", populatedActivity);
    }


    return res.status(201).json(comment);
  } catch (err) {
    console.error("CREATE COMMENT ERROR:", err);
    return res.status(500).json({ message: "Erro ao criar comentário" });
  }
};

/* =========================
   SOLUTIONS
   ========================= */

/**
 * GET /api/exercises/:id/solutions
 * Listar soluções
 */
export const getExerciseSolutions = async (req, res) => {
  const { id: exerciseId } = req.params;

  try {
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const solutions = await Solution.find({ exercise: exerciseId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    return res.json(solutions);
  } catch (err) {
    console.error("GET SOLUTIONS ERROR:", err);
    return res.status(500).json({ message: "Erro ao buscar soluções" });
  }
};

/**
 * POST /api/exercises/:id/solutions (🔒)
 * Criar solução (texto e/ou files[])
 * - Requer pelo menos text OU files
 */
export const createExerciseSolution = async (req, res) => {
  const userId = getUserId(req);
  const { id: exerciseId } = req.params;
  const { text } = req.body;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(exerciseId)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const attachments = mapAttachmentsFromFiles(req.files || []);

    if ((!text || !text.trim()) && attachments.length === 0) {
      return res
        .status(400)
        .json({ message: "Solution must have text or files" });
    }

    const solution = await Solution.create({
      exercise: exerciseId,
      user: userId,
      text: text?.trim() || "",
      attachments,
    });

    await solution.populate("user", "name");

    // ✅ activity: solution
    const activity = await Activity.create({
      type: "solution_added",
      actor: userId,
      exercise: exerciseId,
      solution: solution._id,
      message: `posted a solution on`,
    });

    const io = req.app.get("io");
    if (io) {
      const populatedActivity = await Activity.findById(activity._id)
        .populate("actor", "name email")
        .populate("exercise", "title subject difficulty createdAt");

      io.emit("activity:new", populatedActivity);
    }


    return res.status(201).json(solution);
  } catch (err) {
    console.error("CREATE SOLUTION ERROR:", err);
    return res.status(500).json({ message: "Erro ao criar solução" });
  }
};

/* =========================
   MY EXERCISES / SAVED
   ========================= */

/**
 * GET /api/exercises/mine (🔒)
 * Listar exercícios criados pelo user
 */
export const getMyExercises = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const my = await Exercise.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const myWithCounts = await Promise.all(
      my.map(async (ex) => {
        const [savesCount, commentsCount, solutionsCount] = await Promise.all([
          SavedExercise.countDocuments({ exercise: ex._id }),
          Comment.countDocuments({ exercise: ex._id }),
          Solution.countDocuments({ exercise: ex._id }),
        ]);

        const filesCount = Array.isArray(ex.attachments) ? ex.attachments.length : 0;

        return {
          ...ex,
          savesCount,
          commentsCount,
          solutionsCount,
          filesCount,
        };
      })
    );

    return res.json(myWithCounts);
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Failed to fetch my exercises",
    });
  }
};


/**
 * GET /api/exercises/saved (🔒)
 * Listar exercícios guardados pelo user
 */
export const getMySavedExercises = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const saved = await SavedExercise.find({ user: userId })
      .populate({
        path: "exercise",
        populate: { path: "createdBy", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const savedWithCounts = await Promise.all(
      saved.map(async (row) => {
        const ex = row.exercise;
        if (!ex?._id) return row;

        const [commentsCount, solutionsCount, savesCount] = await Promise.all([
          Comment.countDocuments({ exercise: ex._id }),
          Solution.countDocuments({ exercise: ex._id }),
          SavedExercise.countDocuments({ exercise: ex._id }),
        ]);

        return {
          ...row,
          exercise: {
            ...ex,
            commentsCount,
            solutionsCount,
            savesCount,
            filesCount: Array.isArray(ex.attachments) ? ex.attachments.length : 0,
          },
        };
      })
    );

    return res.json(savedWithCounts);
  } catch (err) {
    console.error("GET MY SAVED EXERCISES ERROR:", err);
    return res.status(500).json({ message: "Erro ao buscar guardados" });
  }
};


/* =========================
   UPDATE / DELETE
   ========================= */

/**
 * PUT /api/exercises/:id (🔒)
 * Editar exercício (só criador)
 * - file opcional (se vier, substitui attachments)
 */
export const updateExercise = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id);
    if (!exercise)
      return res.status(404).json({ message: "Exercise not found" });

    if (exercise.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, subject, difficulty } = req.body;

    if (title !== undefined) exercise.title = title;
    if (description !== undefined) exercise.description = description;
    if (subject !== undefined) exercise.subject = subject;
    if (difficulty !== undefined) exercise.difficulty = difficulty;

    if (req.files && req.files.length > 0) {
      exercise.attachments = mapAttachmentsFromFiles(req.files);
    }

    await exercise.save();
    await exercise.populate("createdBy", "name email");

    const [savesCount, commentsCount, solutionsCount] = await Promise.all([
      SavedExercise.countDocuments({ exercise: exercise._id }),
      Comment.countDocuments({ exercise: exercise._id }),
      Solution.countDocuments({ exercise: exercise._id }),
    ]);

    return res.json({
      ...exercise.toObject(),
      savesCount,
      commentsCount,
      solutionsCount,
    });
  } catch (err) {
    console.error("UPDATE EXERCISE ERROR:", err);
    return res.status(500).json({ message: "Failed to update exercise" });
  }
};

/**
 * DELETE /api/exercises/:id (🔒)
 * Apagar exercício (só criador)
 * - apaga também saves/comments/solutions
 */
export const deleteExercise = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid exercise id" });
    }

    const exercise = await Exercise.findById(id);
    if (!exercise)
      return res.status(404).json({ message: "Exercise not found" });

    if (exercise.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Promise.all([
      SavedExercise.deleteMany({ exercise: id }),
      Comment.deleteMany({ exercise: id }),
      Solution.deleteMany({ exercise: id }),
    ]);

    await exercise.deleteOne();

    return res.json({ message: "Exercise deleted" });
  } catch (err) {
    console.error("DELETE EXERCISE ERROR:", err);
    return res.status(500).json({ message: "Failed to delete exercise" });
  }
};
