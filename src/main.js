import Vue from 'vue'
import SuiVue from 'semantic-ui-vue'
import VueNeo4j from 'vue-neo4j'
import App from './App.vue'

import 'semantic-ui-css/semantic.min.css'


Vue.config.productionTip = false

Vue.use(SuiVue)
Vue.use(VueNeo4j)

new Vue({
  render: h => h(App),
}).$mount('#app')
