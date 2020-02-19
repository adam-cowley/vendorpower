<template>
    <div>
      <sui-form v-if="!loading" @submit.prevent="handleSubmit">
        <h2 is="sui-header">Create Customer</h2>

        <div class="loading ui info message" v-if="creating">
          Creating Database, please wait.
        </div>

        <div class="ui info message" v-if="confirmations.length" @click="clearConfirmations">
          <ul>
            <li v-for="c in confirmations" :key="c" v-html="c" />
          </ul>
        </div>

        <sui-form-field>
          <label>Name</label>
          <sui-input v-model="name" />
        </sui-form-field>
        <sui-form-field>
          <label>Password</label>
          <sui-input password v-model="password" />
        </sui-form-field>
        <sui-form-field>
          <label>Package</label>
          <sui-dropdown
            placeholder="Package"
            selection
            :options="products"
            v-model="product"
          />
        </sui-form-field>
        <sui-button primary>Submit</sui-button>
      </sui-form>
    </div>
</template>

<script>
/* eslint-disable */
import neo4j from 'neo4j-driver'

export default {
  name: 'CreateCustomer',
  data: () => ({
    loading: true,
    products: [],

    name: null, 
    password: null,
    product: null,

    creating: false,
    confirmations: [],

  }),
  mounted() {
    this.$neo4j.run(`
      MATCH (p:Product)
      RETURN p.id AS id, 
        p.name AS name, 
        [ (p)-[:REQUIRES_SCRIPT]->(s) | s.cypher ] AS scripts
    `, {}, { database: 'customers' })
      .then(res => {
        this.products = res.records.map(row => ({
          value: row.get('id').toString(),
          text: row.get('name'),
          scripts: row.get('scripts'),
        }))

        this.loading = false
      })
  },
  methods: {
    clearConfirmations() {
      this.confirmations = []
    },
    async handleSubmit() {
      this.confirmations = []
      this.creating = true

      // Create Customer in Customers database
      const createCustomer = await this.$neo4j.run(`
        MATCH (p:Product {id: $product})
        MERGE (c:Customer { name: $name })
        CREATE (s:Subscription { id: $name + '-' + $product + '-' + date(), startDate: date(), endDate: date()+duration('P365D') })
        MERGE (c)-[:HAS_SUBSCRIPTION]->(s)-[:FOR_PRODUCT]->(p)

      `, { product: this.product, name: this.name }, { database: 'customers' })


      const system = this.$neo4j.getSession({ database: 'system' })

      const { name, password } = this

      // Create Database
      await system.run(`
        CREATE DATABASE ${name}
      `)

      this.confirmations.push(`Database ${name} created`)

      // Deny access to everyone
      await system.run(`
        DENY ACCESS ON DATABASE ${name} TO customer
      `)
      this.confirmations.push(`Access denied to ${name} for members with cuatomer role`)

      // Create user
      await system.run(`
        CREATE USER ${name} SET PASSWORD $password CHANGE NOT REQUIRED
      `, { password: this.password })

      this.confirmations.push(`The user ${name} has been created with password ${password}`)

      // Assign generic role to user
      await system.run(`
        GRANT ROLE customer to ${name}
      `)

      this.confirmations.push(`Assigned ${name} to customer role`)

      // Create unique role for database
      await system.run(`
        CREATE ROLE ${name}
      `)

      this.confirmations.push(`New role ${name} created`)

      // Grant unique role access to the new database
      await system.run(`
        GRANT ACCESS ON DATABASE ${name} to ${name}
      `)

      this.confirmations.push(`Role ${name} granted access to ${name}`)

      // Grant name management 
      await system.run(`
        GRANT NAME MANAGEMENT ON DATABASE ${name} to ${name}
      `)

      this.confirmations.push(`Role ${name} granted management privileges to ${name}`)
      
      // Grant write access (privilege to create labels, relationship types, and property names) to the database
      await system.run(`
        GRANT WRITE ON GRAPH ${name} to ${name}
      `)

      this.confirmations.push(`Role ${name} granted write access to ${name}`)
      

      // Assign unique role to user
      await system.run(`
        GRANT ROLE ${name} to ${name}
      `)

      this.confirmations.push(`Assigned ${name} to ${name} role`)

      // Seed Data
      const customerDriver = new neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(name, password))
      const customerSession = customerDriver.session({ database: name })

      await this.products.find(p => p.value == this.product)
        .scripts
        .map(async cypher => customerSession.run(cypher))

      this.confirmations.push(`Seed scripts run against database ${name}`)

      this.creating = false
    }
  },
}
</script>