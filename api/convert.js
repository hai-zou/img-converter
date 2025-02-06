import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const config = {
	// 允许 Vercel 解析 multipart/form-data
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	// 解析上传的文件
	const form = new formidable.IncomingForm();
	form.uploadDir = "/tmp"; // 临时存储目录
	form.keepExtensions = true;

	form.parse(req, async (err, fields, files) => {
		if (err) {
			return res.status(500).json({ error: "File parsing error" });
		}

		if (!files.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const file = files.file[0]; // 适配 formidable v3

		try {
			const webpPath = path.join("/tmp", `${Date.now()}.webp`);

			// 使用 sharp 进行 WebP 转换
			await sharp(file.filepath)
				.toFormat("webp")
				.toFile(webpPath);

			// 读取转换后的文件并返回
			const webpBuffer = fs.readFileSync(webpPath);
			res.setHeader("Content-Type", "image/webp");
			res.setHeader("Content-Disposition", `attachment; filename=converted.webp`);
			res.end(webpBuffer);
		} catch (error) {
      console.error(error);
			res.status(500).json({ error: "Conversion failed" });
		}
	});
}
