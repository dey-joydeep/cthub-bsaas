// Husky is a development hook; production and CI use their own checks.
if (process.env.NODE_ENV !== 'production' && process.env.CI !== 'true') {
  const husky = (await import('husky')).default;
  const message = husky();
  if (message) console.log(message);
}
