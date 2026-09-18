/**
 * Config de semantic-release (convertida desde .releaserc.json).
 *
 * Se convirtió a JS porque el plugin release-notes-generator necesita un
 * `writerOpts.transform` propio — ver el comentario de `safeCommitTransform`
 * más abajo para el motivo. El resto es una copia sin cambios del
 * .releaserc.json anterior.
 */

/**
 * CAUSA RAIZ: en el pipeline de release de `qa`, `@semantic-release/release-notes-generator`
 * crasheaba con `RangeError: Invalid time value` dentro de `defaultCommitTransform`
 * de conventional-changelog-writer, que hace `new Date(commit.committerDate).toISOString()`
 * sin try/catch cada vez que `commit.committerDate` es truthy.
 *
 * `commit.committerDate` lo produce el propio fetcher de commits de semantic-release
 * (lib/git.js), que usa el paquete `git-log-parser`: arma un `git log` con un formato
 * que empaqueta ~16 campos por commit, separados por los literales `==FIELD==` y
 * `==END==`, y reconstruye cada registro haciendo split() de esos literales sobre el
 * stdout crudo del child process (ver git-log-parser/src/index.js). Ese approach no
 * tiene framing ni checksum, así que depende de que ese stream de stdout nunca caiga
 * en un límite de buffer del pipe del SO de una forma que confunda el split.
 *
 * Esto se reprodujo de forma determinística en el job real "Version & Publish" de
 * GitHub Actions para `qa` (run 35010595510 y un re-run manual posterior), pero NO
 * se reprodujo en más de 20 clones fieles de ese mismo job (mismo rango de commits,
 * mismas versiones de dependencias fijadas por pnpm-lock.yaml, mismo runner
 * ubuntu-latest, tanto parseando el git log crudo como corriendo el binario real de
 * semantic-release hasta completar generateNotes con éxito todas las veces) — ver la
 * investigación que quedó documentada en .claude/rules/infra.md. Eso apunta fuerte a
 * una carrera de timing/chunking de stream en la dependencia `git-log-parser` (sin
 * mantenimiento activo), no a una fecha malformada en un commit puntual (el propio
 * git, y el valor crudo `%ci` de cada commit, se verificaron limpios de punta a punta).
 *
 * En vez de reescribir historia ya publicada de qa/develop/master buscando un "commit
 * malo" que no se reproduce a demanda, esto hace que release-notes-generator tolere
 * un committerDate corrupto/no parseable: intenta recuperar la fecha de otros campos
 * que git-log-parser trajo para el mismo commit (committer.date / author.date anidados,
 * que vienen de placeholders %ci/%ai separados en el mismo formato y por lo tanto no
 * necesariamente sufren la misma corrupción), y solo omite la fecha si ninguno parsea.
 * Nunca lanza excepción.
 *
 * ADVERTENCIA — esto tolera el crash, NO arregla la causa raíz:
 * cuando la carrera de git-log-parser se dispara, no solo corrompe una fecha: PIERDE
 * UN COMMIT ENTERO del stream (verificado: "Found 112 commits" en vez de los 113 reales
 * del rango). Esta tolerancia evita que el pipeline muera, pero el commit perdido sigue
 * faltando en:
 *   1. Las release notes generadas por este mismo plugin (entrada faltante).
 *   2. El release type que calcula @semantic-release/commit-analyzer, que consume la
 *      MISMA lista de commits — si el commit perdido es justo el que trae el footer
 *      BREAKING CHANGE, el bump puede salir "minor" o "patch" cuando correspondía
 *      "major". Ya pasó algo análogo en `master` (salió 1.0.1 en vez de 2.0.0, PR #49),
 *      así que no es hipotético.
 * Mitigación manual mientras esta dependencia no se reemplace: si el release incluye
 * cambios incompatibles, verificar a mano la versión publicada contra lo esperado; y si
 * el log del job "Version & Publish" reporta un "Found N commits" con N menor a la
 * cantidad real de commits del rango (`git rev-list <ultimoTag>..HEAD | wc -l`),
 * re-ejecutar el job antes de dar esa versión por buena.
 */
function safeDate(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const date = candidate instanceof Date ? candidate : new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function safeCommitTransform(commit, _context, options) {
  const HASH_SHORT_LENGTH = 7;
  const HEADER_MAX_LENGTH = 100;
  const { hash, header, committerDate } = commit;

  const resolvedDate = safeDate(committerDate, commit.committer && commit.committer.date, commit.author && commit.author.date);

  if (committerDate) {
    const original = committerDate instanceof Date ? committerDate : new Date(committerDate);
    if (Number.isNaN(original.getTime())) {
      // eslint-disable-next-line no-console
      console.warn(
        `[release-notes] commit ${hash}: committerDate no parseable (probable desync de stream de git-log-parser); ` +
          (resolvedDate
            ? "se usó una fecha de respaldo (committer.date/author.date)."
            : "se omitió la fecha en esta entrada.") +
          " Si el log de este job reporta menos commits que el rango real, revisar el bump de versión antes de confiar en el release.",
      );
    }
  }

  return {
    hash: typeof hash === "string" ? hash.substring(0, HASH_SHORT_LENGTH) : hash,
    header: typeof header === "string" ? header.substring(0, HEADER_MAX_LENGTH) : header,
    committerDate: resolvedDate ? options.formatDate(resolvedDate) : null,
  };
}

module.exports = {
  branches: [
    "master",
    {
      name: "qa",
      prerelease: true,
    },
    {
      name: "develop",
      prerelease: true,
    },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { type: "refactor", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "docs", release: "patch" },
          { type: "ci", release: "patch" },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BC"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BC"],
        },
        writerOpts: {
          groupBy: "type",
          commitGroupsSort: ["feat", "fix", "perf", "refactor", "docs", "ci"],
          commitsSort: ["scope", "subject"],
          transform: safeCommitTransform,
        },
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "perf", section: "Performance" },
            { type: "refactor", section: "Refactoring" },
            { type: "docs", section: "Documentation" },
            { type: "ci", section: "CI/CD" },
            { type: "chore", hidden: true },
            { type: "test", hidden: true },
            { type: "style", hidden: true },
          ],
        },
      },
    ],
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "./scripts/replace-version.sh ${nextRelease.version} ${branch.name} 1_deployment.yml",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "CHANGELOG.md",
          "package.json",
          "pnpm-lock.yaml",
          "ci/develop/1_deployment.yml",
          "ci/qa/1_deployment.yml",
          "ci/master/1_deployment.yml",
        ],
        message: "chore(release): ${nextRelease.version} [skip ci]",
      },
    ],
    "@semantic-release/github",
  ],
};
