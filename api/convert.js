import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false, // 禁用默认的 bodyParser
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const converted = await sharp(data)
      .webp({ quality: 80 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.webp"');
    res.status(200).send(converted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '图片转换失败' });
  }
}