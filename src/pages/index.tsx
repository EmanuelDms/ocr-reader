import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!imagePreview) {
      setError('Selecione uma imagem primeiro!');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      const blob = await fetch(imagePreview).then(res => res.blob());
      formData.append('image', blob);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tabela.xlsx';
        a.click();
      } else {
        throw new Error('Falha ao processar a imagem');
      }
    } catch (err) {
      setError('Erro: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }''
  };

  return (
    <div className="container">
      <Head>
        <title>OCR para Excel</title>
      </Head>

      <h1>📷 OCR para Excel</h1>
      <p>Converta tabelas em imagens para planilhas automaticamente</p>

      <div className="upload-area" onClick={() => document.getElementById('imageInput')?.click()}>
        <input
          id="imageInput"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        {imagePreview ? (
          <img src={imagePreview} alt="Pré-visualização" className="preview" />
        ) : (
          <p>Clique para selecionar uma imagem ou arraste aqui</p>
        )}
      </div>

      {isProcessing && <div className="spinner"></div>}
      {error && <div className="error">{error}</div>}

      <button onClick={processImage} disabled={!imagePreview || isProcessing}>
        {isProcessing ? 'Processando...' : 'Converter para Excel'}
      </button>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .upload-area {
          border: 2px dashed #ccc;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .preview {
          max-width: 100%;
          max-height: 300px;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #4CAF50;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        .error {
          color: #f44336;
          margin: 10px 0;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}