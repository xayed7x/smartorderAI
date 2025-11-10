// .pnpmfile.cjs
module.exports = {
  hooks: {
    readPackage(pkg) {
      // This hook is read for every package during installation.
      if (pkg.name === 'sharp') {
        // When pnpm finds the 'sharp' package, this rule will apply.
        // We are telling pnpm: "Do NOT ignore the install scripts for this specific package."
        pkg.ignoreScripts = false;
      }
      return pkg;
    }
  }
};