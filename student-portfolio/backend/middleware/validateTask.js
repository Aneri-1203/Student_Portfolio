function validateTask(req, res, next) {
  const { title } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  next();
}

module.exports = validateTask;