const { withXcodeProject } = require('@expo/config-plugins');

/**
 * This machine's checkout path contains spaces ("Quiz Master Mobile App").
 * The stock RN/Expo "Bundle React Native code and images" build phase resolves
 * the path to react-native-xcode.sh via unquoted command substitution:
 *
 *   `"$NODE_BINARY" --print "require('path').dirname(...) + '/scripts/react-native-xcode.sh'"`
 *
 * Because the backticked result isn't quoted, bash word-splits on the spaces
 * in the path and tries to execute the fragment before the first space,
 * failing with "No such file or directory: .../Quiz".
 *
 * This plugin re-wraps that command substitution in quotes so it survives
 * `expo prebuild` regenerating ios/ from scratch.
 */
const BROKEN_SUBSTITUTION =
  '`"$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'"`';
const FIXED_SUBSTITUTION = '"' + BROKEN_SUBSTITUTION + '"';

function withQuotedBundlePhase(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const shellScriptBuildPhases = project.hash.project.objects.PBXShellScriptBuildPhase || {};

    for (const key of Object.keys(shellScriptBuildPhases)) {
      const phase = shellScriptBuildPhases[key];
      if (!phase || phase.name !== '"Bundle React Native code and images"') {
        continue;
      }
      if (typeof phase.shellScript !== 'string') {
        continue;
      }
      if (phase.shellScript.includes(FIXED_SUBSTITUTION)) {
        continue; // already patched
      }
      if (phase.shellScript.includes(BROKEN_SUBSTITUTION)) {
        phase.shellScript = phase.shellScript.split(BROKEN_SUBSTITUTION).join(FIXED_SUBSTITUTION);
      }
    }

    return config;
  });
}

module.exports = withQuotedBundlePhase;
