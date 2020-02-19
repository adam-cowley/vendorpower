<template>
  <div id="app" class="ui container">
    <vue-neo4j-connect
      v-if="!driver"
      :onConnect="onConnect"
      :showActive="true"
    />
    <div v-else>
      <h1 is="sui-header">VendorPower</h1>
      <CreateCustomer />
    </div>
  </div>
</template>

<script>
import CreateCustomer from './components/CreateCustomer'

export default {
  name: 'app',
  components: {
    CreateCustomer,
  },
  data: () => ({ driver: false, }),
  methods: {
    onConnect(driver) {
      this.driver = driver
    },
  },
}
</script>

<style>
#app {
  padding: 24px 0;
}
</style>