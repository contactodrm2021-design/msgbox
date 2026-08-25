import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

// 强制 Node runtime —— 确保 Buffer / FormData arrayBuffer 行为稳定
export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: '缺少 CLOUDINARY_CLOUD_NAME 环境变量' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }
    if (typeof file === 'string') {
      return NextResponse.json({ error: '上传字段格式错误' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name || 'file', { mime: file.type });

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      name: file.name,
      bytes: result.bytes,
      format: result.format,
      resourceType: result.resourceType,
    });
  } catch (err) {
    const detail = {
      message: err?.message,
      http_code: err?.http_code,
      name: err?.name,
      stack: typeof process !== 'undefined' ? String(err?.stack || '').split('\n').slice(0, 4).join(' | ') : '',
    };
    console.error('[upload] failed:', detail);

    const status = err?.http_code && err.http_code >= 400 && err.http_code < 600 ? err.http_code : 500;
    return NextResponse.json(
      {
        error: `上传失败：${detail.message || '未知错误'}`,
        code: detail.http_code || null,
        name: detail.name || null,
      },
      { status }
    );
  }
}
