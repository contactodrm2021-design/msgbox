import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: '未选择文件' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToCloudinary(buffer, file.name);
    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    return NextResponse.json({ error: '上传失败: ' + err.message }, { status: 500 });
  }
}
