import cloudinary from '@/lib/cloudinary';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'creator' && session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only creators can upload images' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<{ secure_url: string; width: number; height: number }>(
            (resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'webtoons' },
                    (error, result) => {
                        if (error || !result) return reject(error);
                        resolve({
                            secure_url: result.secure_url,
                            width: result.width,
                            height: result.height,
                        });
                    }
                );
                stream.end(buffer);
            }
        );

        return NextResponse.json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
            },
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}