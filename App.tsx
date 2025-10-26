
import React, { useState, useRef } from 'react';
import { generateImage } from './services/geminiService';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File, preview: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
      setUploadedImage({
        file,
        preview: URL.createObjectURL(file),
      });
      setGeneratedImage(null);
      setError(null);
    }
  };

  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let imageInput;
      if (uploadedImage) {
        const base64Data = await fileToBase64(uploadedImage.file);
        imageInput = {
          data: base64Data,
          mimeType: uploadedImage.file.type,
        };
      }
      
      const base64Image = await generateImage(prompt, imageInput);
      const imageUrl = `data:image/png;base64,${base64Image}`;
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('Failed to generate image. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen text-slate-100 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Komodo Image Generator
          </h1>
          <p className="text-slate-400 mt-2">
            Turn your imagination into imagery with AI. Upload a photo to start editing.
          </p>
        </header>

        <main>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Input Pane */}
            <div className="w-full aspect-square bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative group">
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  id="file-upload"
              />
              {uploadedImage ? (
                  <>
                      <img src={uploadedImage.preview} alt="Upload preview" className="w-full h-full object-contain" />
                      <button
                          onClick={removeUploadedImage}
                          className="absolute top-2 right-2 bg-slate-900/50 p-2 rounded-full text-white hover:bg-red-500/80 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          aria-label="Remove uploaded image"
                      >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </>
              ) : (
                  <label htmlFor="file-upload" className="text-center text-slate-500 cursor-pointer p-8">
                       <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 font-semibold text-cyan-400">Upload an Image</p>
                      <p className="text-sm">to edit with your prompt</p>
                  </label>
              )}
            </div>

            {/* Output Pane */}
            <div className="w-full aspect-square bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative">
               {isLoading && (
                  <div className="text-center">
                      <Spinner />
                      <p className="mt-2 text-slate-400">Conjuring your masterpiece...</p>
                  </div>
              )}
              {error && <p className="text-red-400 p-4">{error}</p>}
              {!isLoading && !error && generatedImage && (
                <>
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={handleDownload} 
                    className="absolute bottom-4 right-4 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Download
                  </button>
                </>
              )}
              {!isLoading && !error && !generatedImage && (
                <p className="text-slate-500">Your generated image will appear here</p>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={uploadedImage ? "Describe the edits you want to make..." : "e.g., A majestic lion wearing a crown, cinematic style"}
              className="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 h-28 resize-none"
              aria-label="Image generation prompt"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full px-8 py-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
          </form>
        </main>
      </div>
       <footer className="w-full text-center p-4 mt-8 text-slate-500 text-sm">
        <p>Powered by Komodo API & React. Crafted with passion.</p>
      </footer>
    </div>
  );
};

export default App;
