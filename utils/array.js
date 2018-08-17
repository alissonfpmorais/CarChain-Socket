module.exports = function() {
    Array.prototype.has = function(value) {
        return this.indexOf(value) >= 0
    }
    
    Array.prototype.notHas = function(value) {
        return !this.has(value)
    }
    
    Array.prototype.isEmpty = function() {
        return this.length <= 0
    }
    
    Array.prototype.isNotEmpty = function() {
        return !this.isEmpty()
    }
    
    Array.prototype.remove = function(value) {
        const index = this.indexOf(value)
        if (index >= 0) this.splice(index, 1)
    }

    Array.prototype.diff = function(arr) {
        return this.filter(item => arr.indexOf(item) < 0)
    }
}