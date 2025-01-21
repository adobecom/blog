import { importMapsPlugin } from '@web/dev-server-import-maps';
import { defaultReporter, summaryReporter } from '@web/test-runner';
import { playwrightLauncher } from '@web/test-runner-playwright';

function customReporter() {
  return {
    async reportTestFileResults({ logger, sessionsForTestFile }) {
      sessionsForTestFile.forEach((session) => {
        session.testResults.tests.forEach((test) => {
          if (!test.passed && !test.skipped) {
            logger.log(test);
          }
        });
      });
    },
  };
}

export default {
  playwright: true,
  browsers: [
    playwrightLauncher({ product: 'chromium', launchOptions: { headless: true } }),
  ],  
  coverageConfig: {
    include: ['blocks/**', 'scripts/**'],
    exclude: ['test/**', '**/node_modules/**'],
  },
  plugins: [importMapsPlugin({})],
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    customReporter(),
  ],
};
