#!/bin/bash

# Fix "next(error)" to "return next(error)" in controllers
find src/controllers -name "*.ts" -type f -exec sed -i '' 's/^\([ ]*\)next(error);$/\1return next(error);/g' {} \;

# Fix unused parameters by prefixing with underscore
sed -i '' 's/async getHealth(req:/async getHealth(_req:/g' src/controllers/health.controller.ts
sed -i '' 's/async getCurrentJackpot(req:/async getCurrentJackpot(_req:/g' src/controllers/jackpot.controller.ts
sed -i '' 's/async getAllSkills(req:/async getAllSkills(_req:/g' src/controllers/skill.controller.ts

# Fix middleware unused parameters
sed -i '' 's/(err: Error, req: Request, res: Response, next: NextFunction)/(err: Error, _req: Request, res: Response, _next: NextFunction)/g' src/middlewares/error-handler.ts
sed -i '' 's/const handler = (req: Request,/const handler = (_req: Request,/g' src/middlewares/rate-limit.ts
sed -i '' 's/export const validate = (schema: AnyZodObject) => (req: Request, res: Response,/export const validate = (schema: AnyZodObject) => (req: Request, _res: Response,/g' src/middlewares/validate.ts
sed -i '' 's/(_req: Request, res: Response, next: NextFunction)/(req: Request, res: Response, next: NextFunction)/g' src/middlewares/auth.ts

echo "Fixed TypeScript errors"
