const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const db_path = path.join(__dirname, 'covid19India.db')

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
    app.listen(3000, (request,response) => {
      console.log('Server running at port 3000....')
    })
  } catch (e) {
    console.log(`error is: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    select * from state;`
  const statesArray = await db.all(getStatesQuery)
  const ans = item => {
    return {
      stateId: item['state_id'],
      stateName: item['state_name'],
      population: item['population'],
    }
  }
  const ansArray = statesArray.map(item => {
    return ans(item)
  })
  response.send(ansArray)
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    select * from state where state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  const ans = item => {
    return {
      stateId: item['state_id'],
      stateName: item['state_name'],
      population: item['population'],
    }
  }
  const ansState = ans(state)
  response.send(ansState)
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const postDistrictQuery = `
  insert into district
  (district_name,state_id,cases,cured,active,deaths)
  values (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    select * from district where district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  const ans = item => {
    return {
      districtId: item['district_id'],
      districtName: item['district_name'],
      stateId: item['state_id'],
      cases: item['cases'],
      cured: item['cured'],
      active: item['active'],
      deaths: item['deaths'],
    }
  }
  const ansDistrict = ans(district)
  response.send(ansDistrict)
})

app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  delete from district where district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const postDistrictQuery = `
  update  district
  set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  where district_id = ${districtId};`
  await db.run(postDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
  select 
   sum(cases) as totalCases,
   sum(cured) as totalCured,
   sum(active) as totalActive,
   sum(deaths) as totalDeaths
  from district
  where state_id = ${stateId};`
  const stats = await db.get(getStatsQuery)
  response.send(stats)
})

app.get('/districts/:districtId/details', async (request, response) => {
  const {districtId} = request.params
  const getdetailsQuery = `
  select 
  state_name as stateName
  from state
  where state_id = (
    select state_id from
    district where district_id = ${districtId}
  );`
  const details = await db.get(getdetailsQuery)
  response.send(details)
})
module.exports = app
