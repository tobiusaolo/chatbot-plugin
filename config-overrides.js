const { override } = require('customize-cra');

module.exports = override((config) => {
  config.output = {
    ...config.output,
    filename: 'static/js/chat.bundle.js',
    library: 'AIChatPlugin',
    libraryTarget: 'umd',
    publicPath: '/',
  };

  config.externals = {
    react: 'React',
    'react-dom': 'ReactDOM',
  };

  return config;
});
