import { Lexer } from "appkit/details/Lexer"
import { makeUnit, type Unit } from "appkit/units/Unit"
import BigNumber from "bignumber.js"

// https://en.wikipedia.org/wiki/Metric_system

// distance/length, time, mass, temperature
// candela, watt, volt, ampere, mole

// https://www.boost.org/doc/libs/latest/doc/html/boost_units.html
// name: meter, symbol: s

// unit: length, volume, temperature, pressure, amount
// quantity<unit>

// https://units.readthedocs.io/en/latest/
// The Units library provides a means of working with units of measurement at runtime, including conversion to and from strings. 

// The basics of units are the seven SI base units:
// the kilogram (kg), for mass.
// the second (s), for time.
// the kelvin (K), for temperature.
// the ampere (A), for electric current.
// the mole (mol), for the amount of a substance.
// the candela (cd), for luminous intensity.
// the meter (m), for distance.

// additionally
// radian(rad), for angular measurement
// Currency ($), for monetary values
// Count (cnt), for single object counting

// Math.js
// js-quantities
