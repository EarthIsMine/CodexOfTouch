import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { successResponse, errorResponse } from '@/utils/response';
import { AppError } from '@/utils/errors';

export class AssetsController {
  /**
   * GET /assets/:assetFolder
   * 지정된 assetFolder 안의 모든 파일 목록을 반환합니다.
   */
  async getAssetFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { assetFolder } = req.params;

      // Validate assetFolder name (prevent path traversal)
      if (!assetFolder || /[./\\]/.test(assetFolder)) {
        throw new AppError('ASSET_001', 'Invalid asset folder name', 400);
      }

      const publicDir = path.join(__dirname, '../../public');
      const folderPath = path.join(publicDir, assetFolder);

      // Check if folder exists
      try {
        const stats = await fs.stat(folderPath);
        if (!stats.isDirectory()) {
          throw new AppError('ASSET_001', 'Asset folder not found', 404);
        }
      } catch (error) {
        throw new AppError('ASSET_001', 'Asset folder not found', 404);
      }

      // Read all files in the folder
      const files = await fs.readdir(folderPath);

      // Create file list with URLs
      const fileList = files.map((fileName) => ({
        name: fileName,
        url: `/public/${assetFolder}/${fileName}`,
      }));

      return successResponse(
        res,
        {
          folder: assetFolder,
          files: fileList,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AssetsController();
