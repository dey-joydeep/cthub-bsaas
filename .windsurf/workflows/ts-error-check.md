---
description: Workfolow for checking typescript compilation errors and fix
---

#Error check method
- From the root in terminal, run the command `npx tsc --noEmit --pretty --skipLibCheck false > ./logs/ts-error.log`
- Examine each error
- Check import errors first.
- For missing item, check if the element (function, variable, type etc.) are moved, renamed or alike. If no reference is found, create missing element.
- For other type of errors, fix as instructed.
- Repeat the first step untill there are no more errors.