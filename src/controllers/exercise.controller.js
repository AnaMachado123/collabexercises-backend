import Exercise from "../models/Exercise.js";

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

    // 🚫 BLOQUEIO: não criar exercício sem ficheiro
    if (!req.file) {
      return res.status(400).json({
        message: "File upload is required",
      });
    }

    // 📎 Ficheiro vindo do Cloudinary
    const attachments = [
      {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    ];

    const exercise = await Exercise.create({
      title,
      description,
      subject,
      difficulty,
      attachments,
      createdBy: req.user._id,
    });

    return res.status(201).json(exercise);
  } catch (error) {
    console.error("CREATE EXERCISE ERROR:", error);

    // ✅ RESPOSTA CORRETA (nunca devolve objeto bruto)
    return res.status(500).json({
      message: error.message || "Failed to create exercise",
    });
  }
};

/**
 * GET /api/exercises
 * Pesquisa + filtros
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

    return res.status(200).json(exercises);
  } catch (error) {
    console.error("GET EXERCISES ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch exercises",
    });
  }
};

/**
 * GET /api/exercises/:id
 * Obter exercício individual
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

    return res.status(200).json(exercise);
  } catch (error) {
    console.error("GET EXERCISE BY ID ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch exercise",
    });
  }
};
