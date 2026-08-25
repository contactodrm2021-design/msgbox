import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToCloudinary(buffer, file.name);
    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    // 详细记录 Cloudinary 返回的错误，便于定位"General Error"这类泛化报错
    console.error('[upload] 上传失败:', {
      message: err.message,
      http_code: err.http_code,
      name: err.name,
      body: err.body ? String(err.body).slice(0, 500) : undefined,
    });

    return NextResponse.json(
      {
        error: `上传失败（HTTP ${err.http_code || '网络错误'}）：${err.message}`,
        detail: err.body ? String(err.body).slice(0, 300) : undefined,
      },
      { status: 500 }
    );
  }
}
