/**
 * Config de semantic-release (convertida desde .releaserc.json).
 *
 * Se convirtió a JS porque el plugin release-notes-generator necesita un
 * `writerOpts.transform` propio — ver el comentario de `safeCommitTransform`
 * más abajo para el motivo. El resto es una copia sin cambios del
 * .releaserc.json anterior.
 */

/**
 * CAUSA RAIZ (corregida — ver nota de corrección más abajo): en el pipeline de
 * release de `qa`, `@semantic-release/release-notes-generator` crasheaba con
 * `RangeError: Invalid time value` dentro de `defaultCommitTransform` de
 * conventional-changelog-writer, que hace `new Date(commit.committerDate).toISOString()`
 * sin try/catch cada vez que `commit.committerDate` es truthy. Más tarde
 * apareció un crash hermano en `@semantic-release/github` (paso "success"):
 * un error de parseo de GraphQL porque `commit.hash` venía con basura en vez
 * de un SHA.
 *
 * Ambos campos (`committerDate` y `hash`) los produce el propio fetcher de
 * commits de semantic-release (lib/git.js), que usa el paquete `git-log-parser`:
 * arma un `git log` con un formato que empaqueta ~16 campos por commit,
 * separados por dos literales de texto legible (ver el código de
 * `git-log-parser` para los valores exactos — no se repiten aquí a propósito,
 * ver la nota de corrección), y reconstruye cada registro haciendo split() de
 * esos literales sobre el stdout crudo del child process. Ese approach no
 * tiene framing ni checksum: si el %B (mensaje completo) de CUALQUIER commit
 * del rango contiene esos mismos literales como texto, el split() encuentra
 * delimitadores de más ahí adentro y desincroniza los campos que vienen
 * después en el formato (hash/mensaje/tags/fecha quedan con el valor de otro
 * campo, o se pierde un commit entero si el literal de fin-de-registro cae en
 * medio del cuerpo).
 *
 * NOTA DE CORRECCIÓN: la primera versión de este comentario (y del PR/README
 * que lo acompañaba) atribuía esto a "una carrera de timing/chunking de
 * stream" — evidencia real (20+ clones fieles del job real en ubuntu-latest
 * sin reproducirlo) pero conclusión incorrecta. La causa real, confirmada
 * reproduciendo el crash de `@semantic-release/github` de forma 100%
 * determinística: el commit que introdujo el primer fix (el que agregó este
 * mismo archivo) describía el mecanismo de `git-log-parser` citando sus dos
 * literales textualmente en el cuerpo del commit/PR — y ESE mensaje, al
 * volver a pasar por `git-log-parser` en el siguiente release, colisionó con
 * sus propios delimitadores. No es timing: es 100% determinístico y depende
 * únicamente del contenido del mensaje de commit. Por eso esta clase de bug
 * no se veía en el rango original (ningún commit de esa tanda citaba esos
 * literales) y sí apareció en cuanto un commit los citó.
 *
 * FIX REAL (además de la tolerancia de abajo): se aplicó un patch de pnpm a
 * `git-log-parser` (ver patches/git-log-parser@1.2.1.patch) que cambia esos
 * dos literales de texto legible por caracteres de control ASCII (Record/Unit
 * Separator) que nunca aparecen en texto escrito por una persona. Eso cierra
 * la colisión de raíz para CUALQUIER campo (no solo `committerDate`) y para
 * CUALQUIER plugin que lea `context.commits` (no solo release-notes-generator),
 * incluido el crash de `@semantic-release/github`. Verificado: con el patch,
 * tanto el rango original como el rango que incluía el commit "contaminado"
 * parsean 0 registros corruptos.
 *
 * Con el patch aplicado, el `writerOpts.transform` de abajo debería ser
 * puro colchón de seguridad (nunca debería activarse), pero se deja puesto
 * por las dudas: es barato y cubre cualquier otra clase de corrupción que no
 * hayamos previsto. Si en algún momento se ve el warning de más abajo en un
 * log real, es señal de que el patch dejó de aplicar o de que aparece una
 * colisión distinta — no ignorarlo.
 *
 * ADVERTENCIA que sigue vigente aunque el patch esté aplicado: el commit que
 * disparó esto (la promoción del primer fix) ya quedó publicado con sus
 * campos corruptos en el historial de `qa` — no se reescribe. Su entrada en
 * el CHANGELOG/release notes de v1.0.0-qa.6 quedó con el hash/subject mal
 * formados (cosmético, ya publicado); las corridas FUTURAS que necesiten
 * re-leer ese commit (por ejemplo, un rango que lo vuelva a incluir) ya lo
 * van a parsear bien gracias al patch. Regla para no repetir esto: nunca
 * citar textualmente los delimitadores de `git-log-parser` (los del código
 * fuente del paquete) en un mensaje de commit o cuerpo de PR — citarlos en
 * comentarios de código (como este) es inocuo, porque `git log %B` solo lee
 * el mensaje del commit, no el contenido de los archivos.
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
        `[release-notes] commit ${hash}: committerDate no parseable. Con el patch de git-log-parser ` +
          "esto no debería pasar más — si aparece, revisar si el patch sigue aplicando " +
          "(pnpm.patchedDependencies en package.json) o si hay una colisión de delimitador nueva. " +
          (resolvedDate
            ? "Por ahora se usó una fecha de respaldo (committer.date/author.date)."
            : "Por ahora se omitió la fecha en esta entrada.") +
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
