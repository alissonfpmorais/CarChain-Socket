function Kind(data) { }

function Try(data) {
    Kind.call()
    this.value = data
}

Try.prototype.run = function(compute) {
    try { 
        if (this.value === undefined) throw 'undefined!'
        return compute(this.value)
    }
    catch(err) { return undefined }
}

Try.prototype.debug = function(tag) {
    console.log(tag + ': ' + this.value)
    return this
}

Try.prototype.doOnSuccess = function(compute) {
    if (this.value !== undefined) {
        try { compute(this.value) }
        catch(err) { return this }
    }
    return this
}

Try.prototype.doOnFailure = function(compute) {
    if (this.value === undefined) {
        try { compute() }
        catch(err) { return this }
    }
    return this
}

Try.prototype.filter = function(compute) {
    if (this.run(compute) === true) return this
    return new Try(undefined)
}

Try.prototype.map = function(compute) {
    return new Try(this.run(compute))
}

Try.prototype.flatMap = function(compute) {
    return this.run(compute)
}

Try.prototype.getOrElse = function(onFailure) {
    if (this.value === undefined) return onFailure()
    return this.value
}

function Either(dataLeft, dataRight) {
    this.left = dataLeft
    this.right = dataRight
}

Either.prototype.toLeft = function(dataLeft) {
    return new Either(dataLeft, undefined)
}

Either.prototype.toRight = function(dataRight) {
    return new Either(undefined, dataRight)
}

Either.prototype.map = function(compute) {
    if (this.left === undefined && this.right !== undefined) return new Either().right(compute(this.right))
    return this
}

Either.prototype.flatMap = function(compute) {
    if (this.left === undefined && this.right !== undefined) return compute(this.right)
    return this
}

module.exports = { Kind, Try, Either }