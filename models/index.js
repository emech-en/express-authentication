function loadModels() {
  return {
    Token: require('./token').model,
  }
}

module.exports = {
  models: models,
  initConfig: function(configs) {
    require('./token').init(configs.token || {})
  }
}