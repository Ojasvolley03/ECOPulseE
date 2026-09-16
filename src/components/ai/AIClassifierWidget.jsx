import React, { useState } from 'react';
import { api } from '../../services/api';
import { Sparkles, Upload, FileImage, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AIClassifierWidget({ onClassificationComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.classifyWasteImage(formData);
      if (res.success && res.data) {
        setResult(res.data);
        if (onClassificationComplete) {
          onClassificationComplete(res.data);
        }
      } else {
        setError('Classification failed.');
      }
    } catch (err) {
      setError(err.message || 'AI Classification error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">AI Waste Classifier</h4>
            <p className="text-xs text-slate-400">Classifies image into Plastic, Paper, Glass, Metal, Organic, Mixed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 transition cursor-pointer relative bg-slate-950/40">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
          ) : (
            <div className="py-4 space-y-2">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Click or drop waste image here</p>
              <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</p>
            </div>
          )}
        </div>

        {/* AI Result Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          {result ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Detected Category:</span>
                <span className="font-bold text-sm text-emerald-400 font-mono px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                  {result.category}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Confidence Score:</span>
                <span className="font-mono text-slate-200 font-bold">{Math.round(result.confidence * 100)}%</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] pt-1">{result.description}</p>
              <p className="text-emerald-400/90 text-[11px] font-medium pt-1 italic">{result.recommendation}</p>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              {loading ? (
                <div className="space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                  <p className="text-slate-300">Running Computer Vision Model...</p>
                </div>
              ) : (
                <p>Upload a waste photo and click "Analyze with AI" to view category classification.</p>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full mt-3 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Waste Image</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>
      )}
    </div>
  );
}
