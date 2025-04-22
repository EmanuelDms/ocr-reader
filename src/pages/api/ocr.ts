// @ts-check
import multer from 'multer';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';

export const config = {
  api: {
    bodyParser: false
  },
};

// Configuração do multer para salvar arquivo em memória
const upload = multer({ storage: multer.memoryStorage() });

// Criar um handler com next-connect para suportar middleware (multer)
const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(upload.single('image'));

router.post(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  try {
    const worker = await createWorker('por'); // idioma português
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    // Quebrar texto em linhas e colunas (ajuste conforme necessário)
    const rows = text
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(/\s{2,}|\t+/)); // separa por 2+ espaços ou tabs

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader('Content-Disposition', 'attachment; filename=tabela.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(excelBuffer);
  } catch (err) {
    console.error('Erro ao processar imagem:', err);
    res.status(500).json({ error: 'Erro interno ao processar OCR' });
  }
});

export default router.handler({
  onError: (err, req, res) => {
    console.error(err);
    res.status(500).end(err);
  },
});