/* Rewrite specific server-core imports to explicit subpaths, bypassing the barrel.
 * Safe & idempotent: run once.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

const CORE = path.join(repo, 'libs/server/core/src');

function fixFile(p, replacer) {
  const src = fs.readFileSync(p, 'utf8');
  const out = replacer(src);
  if (out !== src) {
    fs.writeFileSync(p, out, 'utf8');
    console.log('✔ Patched', path.relative(repo, p));
  } else {
    console.log('• No change', path.relative(repo, p));
  }
}

// 1) roles.decorator.ts -> UserRole from enums
fixFile(
  path.join(CORE, 'auth/decorators/roles.decorator.ts'),
  (s) => s
    .replace(
      /import\s*\{\s*UserRole\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
      `import { UserRole } from '@cthub-bsaas/shared/enums/user-role.enum';`
    )
);

// 2) roles.guard.ts -> split: AppUserRole (enum) + AuthenticatedUser/UserRoleInfo (types)
fixFile(
  path.join(CORE, 'auth/guards/roles.guard.ts'),
  (s) => {
    // remove the barrel import that mixes enums+types
    let out = s.replace(
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/g,
      (m, names) => {
        const idents = names.split(',').map(x => x.trim());
        const fromEnum = idents.filter(x => x === 'AppUserRole');
        const fromTypes = idents.filter(x => x === 'AuthenticatedUser' || x === 'UserRoleInfo');
        const parts = [];
        if (fromEnum.length) parts.push(`import { ${fromEnum.join(', ')} } from '@cthub-bsaas/shared/enums/user-role.enum';`);
        if (fromTypes.length) parts.push(`import { ${fromTypes.join(', ')} } from '@cthub-bsaas/shared/types/user.types';`);
        return parts.join('\n');
      }
    );
    return out;
  }
);

// 3) current-user.decorator.ts -> AuthenticatedUser from types
fixFile(
  path.join(CORE, 'decorators/current-user.decorator.ts'),
  (s) => s
    .replace(
      /import\s+type\s*\{\s*AuthenticatedUser\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
      `import type { AuthenticatedUser } from '@cthub-bsaas/shared/types/user.types';`
    )
    .replace(
      /import\s*\{\s*AuthenticatedUser\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
      `import { AuthenticatedUser } from '@cthub-bsaas/shared/types/user.types';`
    )
);

// 4) user.decorator.ts -> AuthenticatedUser from types
fixFile(
  path.join(CORE, 'decorators/user.decorator.ts'),
  (s) => s
    .replace(
      /import\s*\{\s*AuthenticatedUser\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
      `import { AuthenticatedUser } from '@cthub-bsaas/shared/types/user.types';`
    )
);

// 5) validators using AppUserRole -> enums
[
  'validation/validators/has-permission.validator.ts',
  'validation/validators/last-admin.validator.ts'
].forEach(rel =>
  fixFile(
    path.join(CORE, rel),
    (s) => s.replace(
      /import\s*\{\s*AppUserRole\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
      `import { AppUserRole } from '@cthub-bsaas/shared/enums/user-role.enum';`
    )
  )
);

// 6) validators using AppointmentStatus -> enums
fixFile(
  path.join(CORE, 'validators/appointment.validators.ts'),
  (s) => s.replace(
    /import\s*\{\s*AppointmentStatus\s*\}\s*from\s*['"]@cthub-bsaas\/shared['"]\s*;?/,
    `import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';`
  )
);

// 7) database.module.ts -> data-access (ensure plain specifier is kept; optional '/index' fallback)
fixFile(
  path.join(CORE, 'database/database.module.ts'),
  (s) => s // if someone accidentally changed it to a wrong subpath before, normalize back
    .replace(
      /import\s*\{\s*PrismaService\s*\}\s*from\s*['"]@cthub-bsaas\/server-data-access(?:\/index)?['"]\s*;?/,
      `import { PrismaService } from '@cthub-bsaas/server-data-access';`
    )
);
