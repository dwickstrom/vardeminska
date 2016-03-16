import React, { Component } from 'react';
import cookie from 'react-cookie';
import {Pie as PieChart} from 'react-chartjs'

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

export default class App extends Component {
  constructor(props) {
    super(props)
    const state = cookie.load('state');

    if (state) {
      this.state = state;
    } else {
      this.state = {
        inkopspris: 100000,
        tax: 2200,
        milage: 1500,
        insurance: 420,
        service_repairs: 15000,
        fuel: 12,
        fuel_usage_rate: 0.7,
        ownership_length: parseFloat(36),
        yearly_value_decay: 16,
        interest_rate: 2,
      }
    }
  }

  handleChange(e) {
    let obj = {};
    obj[e.target.name] = parseFloat(e.target.value);
    this.setState(obj);
    cookie.save('state', JSON.stringify(this.state))
    console.info('change into:', cookie.load('state'))
  }

  calculateValueDecay() {
    const {inkopspris} = this.state;
    const years = this.state.ownership_length / 12;
    const factor = 1 - this.state.yearly_value_decay / 100
    return inkopspris - inkopspris * Math.pow(factor, years)
  }

  getCosts() {
    var money = parseFloat(this.state.inkopspris) +
                parseFloat(this.state.service_repairs) +
                parseFloat(this.getInsurances()) +
                parseFloat(this.getInterest()) +
                parseFloat(this.getTaxes()) +
                parseFloat(this.getFuelCost()) -
                parseFloat(this.getSalePrice())
    return money
  }

  getMilage() {
    return (this.state.milage / 12) * this.state.ownership_length || 0
  }

  getMilageCost() {
    return this.getCosts() / this.getMilage() || 0
  }

  getMonthlyCost() {
    return this.getCosts() / this.state.ownership_length || 0
  }

  getSalePrice() {
    return this.state.inkopspris - this.calculateValueDecay() || 0
  }

  getFuelCost() {
    return this.getMilage() * this.state.fuel * this.state.fuel_usage_rate || 0
  }

  getTaxes() {
    return this.state.ownership_length * (this.state.tax / 12) || 0
  }

  getInsurances() {
    return this.state.ownership_length * this.state.insurance || 0
  }

  getRepairs() {
    return this.state.service_repairs || 0
  }

  getInterest() {
    const months = Array.apply(null, Array(this.state.ownership_length)).map(function (_, i) {return i;});
    const getMonthlyInterest = (amount, interestRate) => {
      const rate = interestRate / 100
      return (amount * rate) / 12
    }
    const getMonthlyDownPaymentAmount = () => {
      return this.calculateValueDecay() / this.state.ownership_length
    }


    const interest = months.reduce((acc, curr) => {
      const monthlyInterest = getMonthlyInterest(acc.amount, this.state.interest_rate)
       return {
        interest: acc.interest + monthlyInterest,
        amount: acc.amount - getMonthlyDownPaymentAmount()
      }
    }, {interest: 0, amount: this.state.inkopspris})

    return round(interest.interest, 0)

  }

  clear() {
    cookie.remove('state')
  }

  saveState() {
    cookie.save('state', JSON.stringify(this.state))
  }

  getChartData() {
    let datapoints = [
      {
        method: 'calculateValueDecay',
        color: '#F7464A',
        highlight: '#FF5A5E',
        label: 'Värdeminskning',
        labelColor : 'white',
        labelFontSize : '16',
      },
      {
        method: 'getInsurances',
        color: '#46BFBD',
        highlight: '#5AD3D1',
        label: 'Försäkringar',
        labelColor : 'white',
        labelFontSize : '16',
      },
      {
        method: 'getTaxes',
        color: '#FDB45C',
        highlight: '#FFC870',
        label: 'Skatter',
      },
      {
        method: 'getFuelCost',
        color: 'pink',
        highlight: '#FFB6C1',
        label: 'Drivmedel',
      },
      {
        method: 'getRepairs',
        color: '#DEB887',
        highlight: '#DEB887',
        label: 'Service & reparationer',
      },
      {
        method: 'getInterest',
        color: 'lightgreen',
        highlight: 'lightgreen',
        label: 'Räntekostnader',
      },

    ]

    return datapoints.map((obj, i) => {
      return {
        value: round(this[obj.method](), 0) || 0,
        color: obj.color,
        highlight: obj.highlight,
        label: obj.label,
      }
    })

  }

  render() {
    return (
      <div className="row" style={{paddingTop: 20}}>
        <div className="col-md-6">
            <div className="form-group">
              <label>Inköpspris</label>
              <input className="form-control" name="inkopspris" onChange={::this.handleChange} type="number" value={this.state.inkopspris}></input>
            </div>

            <div className="form-group">
              <label>Årlig skatt</label>
              <input className="form-control" name="tax" onChange={::this.handleChange} type="number" value={this.state.tax}></input>
            </div>

            <div className="form-group">
              <label>Antal mil per år</label>
              <input className="form-control" name="milage" onChange={::this.handleChange} type="number" value={this.state.milage}></input>
            </div>

            <div className="form-group">
              <label>Försäkringspremie</label>
              <input className="form-control" name="insurance" onChange={::this.handleChange} type="number" value={this.state.insurance}></input>
            </div>
            <button onClick={::this.saveState} className="btn btn-default">Spara kalkyl</button>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label>Reparation och service</label>
              <input className="form-control" name="service_repairs" onChange={::this.handleChange} type="number" value={this.state.service_repairs} />
            </div>

            <div className="form-group">
              <label>Enhetspris drivmedel</label>
              <input className="form-control" name="fuel" onChange={::this.handleChange} type="number" value={this.state.fuel}></input>
            </div>

            <div className="form-group">
              <label>Drivmedelsförbrukning per mil ({this.state.fuel_usage_rate})</label>
              <input type="range" min="0.1" max="1.6" step="0.01" name="fuel_usage_rate" onChange={::this.handleChange} value={this.state.fuel_usage_rate} />
            </div>

            <div className="form-group">
              <label>Ägandetid ({this.state.ownership_length} mån)</label>
              <input type="range" min="0" max="120" step="1" name="ownership_length" onChange={::this.handleChange} value={this.state.ownership_length} />
            </div>

            <div className="form-group">
              <label>Årlig värdeminskning ({this.state.yearly_value_decay} %)</label>
              <input type="range" min="0" max="100" step="0.1" name="yearly_value_decay" onChange={::this.handleChange} value={this.state.yearly_value_decay}></input>
            </div>

            <div className="form-group">
              <label>Ränta ({this.state.interest_rate} %)</label>
              <input type="range" min="0" max="10" step="0.1" name="interest_rate" onChange={::this.handleChange} value={this.state.interest_rate}></input>
            </div>

          </div>
          <hr />
        <div className="col-md-6" style={{paddingTop: 20}}>
          <div>
            <table className="table">
              <tbody>
                <tr>
                  <td>Försäljningspris</td>
                  <td>{round(this.getSalePrice(), 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Försäkringar</td>
                  <td>{round(this.getInsurances(), 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Skatter</td>
                  <td>{round(this.getTaxes(), 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Drivmedel</td>
                  <td>{round(this.getFuelCost(), 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Reparation, service & övrigt</td>
                  <td>{round(this.state.service_repairs, 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Värdeminskning</td>
                  <td>{round(this.calculateValueDecay(), 0) || 0} kr</td>
                </tr>

                <tr>
                  <td>Värdeminskning %</td>
                  <td>{round((this.calculateValueDecay() / this.state.inkopspris) * 100, 2) || 0}%</td>
                </tr>

                <tr>
                  <td>Räntekostnader</td>
                  <td>{this.getInterest() || 0} kr</td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
        <div className="col-md-4" style={{paddingTop: 20}}>
          <PieChart data={this.getChartData()} options={{
              scaleShowLabels: true,
            }} width="270" height="270" />
        </div>
        <div className="col-md-2" style={{paddingTop: 20}}>
          <em>Milkostnad <h3>{round(this.getMilageCost(), 1)} kr</h3></em><br />
          <em>Månadskostnad <h3>{round(this.getMonthlyCost(), 0)} kr</h3></em><br />
          <em>Totalkostnad <h3>{round(this.getCosts(), 0)} kr</h3></em>
        </div>

      </div>
    );
  }
}
