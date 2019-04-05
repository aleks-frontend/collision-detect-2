import utils from './utils'

/**
 * Rotates coordinate system for velocities
 *
 * Takes velocities and alters them as if the coordinate system they're on was rotated
 *
 * @param  Object | velocity | The velocity of an individual particle
 * @param  Float  | angle    | The angle of collision between two objects in radians
 * @return Object | The altered x and y velocities after the coordinate system has been rotated
 */

function rotate(velocity, angle) {
    const rotatedVelocities = {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };

    return rotatedVelocities;
}

/**
 * Swaps out two colliding particles' x and y velocities after running through
 * an elastic collision reaction equation
 *
 * @param  Object | particle      | A particle object with x and y coordinates, plus velocity
 * @param  Object | otherParticle | A particle object with x and y coordinates, plus velocity
 * @return Null | Does not return a value
 */

function resolveCollision(particle, otherParticle) {
    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.x - particle.x;
    const yDist = otherParticle.y - particle.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        // Grab angle between the two colliding particles
        const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);

        // Store mass in var for better readability in collision equation
        const m1 = particle.mass;
        const m2 = otherParticle.mass;

        // Velocity before equation
        const u1 = rotate(particle.velocity, angle);
        const u2 = rotate(otherParticle.velocity, angle);

        // Velocity after 1d collision equation
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y };

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        // Swap particle velocities for realistic bounce effect
        particle.velocity.x = vFinal1.x;
        particle.velocity.y = vFinal1.y;

        otherParticle.velocity.x = vFinal2.x;
        otherParticle.velocity.y = vFinal2.y;
    }
}


const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const mouse = {
    x: -innerWidth,
    y: -innerHeight
}

const colors = ['#D40424', '#FF7F66', '#223040', '#101D29']

// Event Listeners
addEventListener('mousemove', event => {
    mouse.x = event.clientX
    mouse.y = event.clientY

    if ( event.clientX < 0 || event.clientX > innerWidth ) {
        mouse.x = -innerWidth / 2
        mouse.y = -innerHeight / 2
    }
    if ( event.clientY < 0 || event.clientY > innerHeight ) {
        mouse.x = -innerWidth / 2
        mouse.y = -innerHeight / 2
    }
})

addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight

    init()
})

// Utility Functions
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomColor(colors) {
    return colors[ Math.floor(Math.random() * colors.length) ]
}

function distance(x1, y1, x2, y2) {
    const xDistance = x2 - x1
    const yDistance = y2 - y1

    return Math.sqrt( Math.pow(xDistance, 2) + Math.pow(yDistance, 2) )
}

// Objects
function Particle(x, y, radius, color) {
    this.x = x
    this.y = y
    this.velocity = {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5
    }
    this.radius = radius
    this.color = color
    this.mass = 1
    this.opacity = 0
}

Particle.prototype.draw = function() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.save()
    c.globalAlpha = this.opacity
    c.fillStyle = this.color
    c.fill()
    c.restore()
    c.strokeStyle = this.color
    c.stroke()
    c.closePath()
}

let particles
Particle.prototype.update = function(particles) {
    this.draw()

    // Checking for collisions between particles
    for ( let i = 0; i < particles.length; i++ ) {
        if ( this == particles[i] ) continue

        if ( distance( this.x, this.y, particles[i].x, particles[i].y ) < this.radius * 2 ) {
            resolveCollision(this, particles[i])
        }
    }

    // Side wall collision detections
    if ( this.x - this.radius < 0 || this.x + this.radius > canvas.width ) {
        this.velocity.x = - this.velocity.x
    }

    // Top and bottom wall collision detections
    if ( this.y - this.radius < 0 || this.y + this.radius > canvas.height ) {
        this.velocity.y = - this.velocity.y
    }

    // Mouse collision detection
    if ( distance( mouse.x, mouse.y, this.x, this.y ) < 100 ) {
        if ( this.opacity < 0.8 ) {
            this.opacity += 0.01
        }
    } else {
        if ( this.opacity > 0 ) {
            this.opacity -= 0.01

            this.opacity = Math.max(0, this.opacity)
        }
    }

    this.x += this.velocity.x
    this.y += this.velocity.y

}

// Implementation
function init() {
    particles = []

    for (let i = 0; i < 55; i++) {
        let radius = 30
        let x = randomIntFromRange(radius, canvas.width - radius)
        let y = randomIntFromRange(radius, canvas.height - radius)
        let color = randomColor(colors)

        if ( i !== 0 ) {
            for (let j = 0; j < particles.length; j++) {
                if ( distance( x, y, particles[j].x, particles[j].y ) - radius * 2 < 0 ) {
                    x = randomIntFromRange(radius, canvas.width - radius)
                    y = randomIntFromRange(radius, canvas.height - radius)

                    j = -1
                }
            }
        }

        particles.push(new Particle(x, y, radius, color))
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(particle => {
     particle.update(particles)
    })
}

init()
animate()
