import { classifyWasteImage, analyzeComplaintText, predictCriticalBins } from '../services/aiService.js';

export async function handleImageClassification(req, res) {
  try {
    const { image } = req.body;
    let imageSource = image;

    if (req.file) {
      // Read file and convert to base64 if uploaded
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(req.file.path);
      const mime = req.file.mimetype;
      imageSource = `data:${mime};base64,${fileBuffer.toString('base64')}`;
    }

    const result = await classifyWasteImage(imageSource);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error classifying waste image:', err);
    res.status(500).json({ success: false, message: 'Failed to classify image.' });
  }
}

export async function handleComplaintAnalysis(req, res) {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description text is required.' });
    }

    const result = await analyzeComplaintText(description);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error analyzing complaint:', err);
    res.status(500).json({ success: false, message: 'Failed to analyze complaint text.' });
  }
}

export async function handleWastePrediction(req, res) {
  try {
    const predictions = await predictCriticalBins();
    res.json({ success: true, count: predictions.length, data: predictions });
  } catch (err) {
    console.error('Error calculating waste predictions:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate fill level predictions.' });
  }
}
