'use strict'

var Storage = require('./storage')

/**
 * Stores a set of ColorSpaces
 *
 * A "ColorSpace" is a partially complete Color containing a type, a converter,
 * and a set of conversions. The converter is preferably inherited from a
 * BaseSpace. For more info see the description for Color.
 */

var ColorSpaceStore = Storage.create()

/**
 * Adds a ColorSpace to the store. Throws an Error if the ColorSpace already
 * exists.
 */

ColorSpaceStore.add = function (color_space) {
  var proto = Object.getPrototypeOf(ColorSpaceStore)
  proto.add.call(this, color_space.space, color_space)
}

/**
 * Returns an array of adjacent convertable ColorSpaces.
 *
 * It does this by comparing the available conversions on a color space
 * to the color spaces within the ColorSpaceStore.
 */

ColorSpaceStore.findNeighbors = function findNeighbors (space_name) {
  var neighbors = []
  var color_space = this.find(space_name)

  if (color_space === null) return neighbors;

  var conversions = color_space.conversions

  conversions.each(function (conversion, target_name) {
    var target_space = this.find(target_name)
    if (target_space && target_space.is_concrete) {
      neighbors.push(target_name)
    }
  }, this)

  return neighbors
}

/**
 * Merges two Stores.
 *
 * Loops over the <foreign_store> comparing its values with the local store. If
 * the <foreign_store> has any keys that the local does not, it adds them. If
 * both stores have the same key, it calls merge() on the value of the local key
 */

ColorSpaceStore.merge = function merge (foreign_store) {
  foreign_store.each(function (foreign_space, name) {
    var local_space = this.find(name)
    if (local_space) this.mergeSpaces(local_space, foreign_space);
    else this.store[name] = foreign_space
  }, this)
}

/**
 * Merges two ColorSpaces
 *
 * If the <foreign_space> is supplied as the main color space of a plugin, it's
 * conversions will always be prefered. Otherwise we stay safe and keep the
 * current conversions
 *
 * If either of the passed spaces are concrete (resulting from the "to" object
 * of a plugin), the resulting space will always be concrete as well.
 */

ColorSpaceStore.mergeSpaces = function (local_space, foreign_space) {
  // conversions defined by a colorspace's plugin are prefered over conversions
  // defined by the other colorspaces
  var curing = !local_space.is_concrete && foreign_space.is_concrete

  if (curing && foreign_space.limits) {
    local_space.limits.merge(foreign_space.limits)
  }

  local_space.conversions.merge(foreign_space.conversions, { force: curing })

  // when the conversion is over, if the space was abstract make it concrete
  if (curing) local_space.is_concrete = true
}

module.exports = ColorSpaceStore
