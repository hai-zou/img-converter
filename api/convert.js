import formidable from 'formidable';
import sharp from 'sharp';

// 配置 Vercel 服务器禁止默认解析
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = formidable({});

	try {
		let [, files] = await form.parse(req);
		const file = files.file[0];

		const converted =await sharp(file.filepath)
			.rotate()
			.webp({ quality: 80 })
			.toBuffer();

		res.status(200).send(converted);
	} catch (err) {
		console.error(err);
		res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
		res.end(String(err));
		return;
	}
}
