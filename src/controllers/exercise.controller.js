// src/controllers/exercise.controller.js
import Exercise from "../models/Exercise.js";
import SavedExercise from "../models/SavedExercise.js";
import Comment from "../models/Comment.js";
import Solution from "../models/Solution.js";

/**
 * Helpers
 */
const getUserId = (req) => req.user?._id || req.user?.id;

const mapAttachmentsFromFiles = (files = []) => {
  return files.map((f) => ({
    url: f.path,
    publicId: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
  }));
};

/**
 * POST /api/exercises  (🔒 protegido)
 * Criar novo exercício + upload para Cloudinary
 */
export const createExercise = async (req, res) => {
  try {
    const { title, description, subject, difficulty } = req.body;

    // Campos obrigatórios
    if (!title || !description || !subject || !difficulty) {
      return res.status(400).json({
        message: "Title, description, subject and difficulty are required",
      });
    }

   // 🚫 BLOQUEIO: não criar exercício sem ficheiros
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "File upload is required",
      });
    }

    // 📎 Ficheiros vindos do Cloudinary
    const attachments = mapAttachmentsFromFiles(req.files);


    const exercise = await Exercise.create({
      title,
      description,
      subject,
      difficulty,
      attachments,
      createdBy: getUserId(req),
    });

    return res.status(201).json(exercise);
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

    // counts reais (simples e funcional; depois podem otimizar com aggregation)
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
    const exercise = await Exercise.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!exercise) {
      return res.status(404).json({
        message: "Exercise not found",
      });
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
 * Criar comentário (texto + files[])
 * - Requer pelo menos text OU files
 */
export const createExerciseComment = async (req, res) => {
  const userId = getUserId(req);
  const { id: exerciseId } = req.params;
  const { text } = req.body;

  try {
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
    const attachments = mapAttachmentsFromFiles(req.files || []);

    if ((!text || !text.trim()) && attachments.length === 0) {
      return res.status(400).json({ message: "Solution must have text or files" });
    }

    const solution = await Solution.create({
      exercise: exerciseId,
      user: userId,
      text: text?.trim() || "",
      attachments,
    });

    await solution.populate("user", "name");

    return res.status(201).json(solution);
  } catch (err) {
    console.error("CREATE SOLUTION ERROR:", err);
    return res.status(500).json({ message: "Erro ao criar solução" });
  }
};

/**
 * GET /api/exercises/mine (🔒)
 * Listar exercícios criados pelo user
 */
export const getMyExercises = async (req, res) => {
  try {
    const userId = getUserId(req);

    const my = await Exercise.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(my);
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

    const saved = await SavedExercise.find({ user: userId })
      .populate({
        path: "exercise",
        populate: { path: "createdBy", select: "name email" },
      })
      .sort({ createdAt: -1 });

    // devolve o array de SavedExercise (cada item tem .exercise)
    return res.json(saved);
  } catch (err) {
    console.error("GET MY SAVED EXERCISES ERROR:", err);
    return res.status(500).json({ message: "Erro ao buscar guardados" });
  }
};
/**
 * PUT /api/exercises/:id (🔒)
 * Editar exercício (só criador)
 * - pode atualizar title/description/subject/difficulty
 * - file é opcional (se vier, substitui o attachment)
 */
export const updateExercise = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) return res.status(404).json({ message: "Exercise not found" });

    // 🔒 só o criador pode editar
    if (exercise.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, subject, difficulty } = req.body;

    if (title !== undefined) exercise.title = title;
    if (description !== undefined) exercise.description = description;
    if (subject !== undefined) exercise.subject = subject;
    if (difficulty !== undefined) exercise.difficulty = difficulty;

    // ✅ se vierem novos ficheiros, substitui attachments
    if (req.files && req.files.length > 0) {
      exercise.attachments = mapAttachmentsFromFiles(req.files);
    }


    await exercise.save();

    // devolver também os counts (para manter UI consistente)
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
 * - apaga também saves/comments/solutions para não ficarem órfãos
 */
export const deleteExercise = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) return res.status(404).json({ message: "Exercise not found" });

    //  só o criador pode apagar
    if (exercise.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    //  limpar dependências
    await Promise.all([
      SavedExercise.deleteMany({ exercise: id }),
      Comment.deleteMany({ exercise: id }),
      Solution.deleteMany({ exercise: id }),
    ]);

    // apagar o exercício
    await exercise.deleteOne();

    return res.json({ message: "Exercise deleted" });
  } catch (err) {
    console.error("DELETE EXERCISE ERROR:", err);
    return res.status(500).json({ message: "Failed to delete exercise" });
  }
};





