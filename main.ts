namespace SpriteKind {
    export const enemy_projectile = SpriteKind.create()
}

//  variables
let deceleration = 0.9
let player_speed = 20
let player_shot_speed = -100
let enemy_shot_speed = 70
//  sprites
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
ship.y = 108
ship.z = 5
ship.setStayInScreen(true)
let formation_center = sprites.create(image.create(1, 1))
formation_center.setBounceOnWall(true)
formation_center.setVelocity(randint(-10, 10), randint(-10, 10))
//  setup
info.setLife(3)
info.setScore(0)
effects.starField.startScreenEffect()
function set_offset(enemy: Sprite) {
    let x_offset = randint(-4, 4) * 16
    let y_offset = randint(-3, 1) * 16
    sprites.setDataNumber(enemy, "x_offset", x_offset)
    sprites.setDataNumber(enemy, "y_offset", y_offset)
}

function spawn_enemy(start_x: number, start_y: number) {
    let enemy = sprites.create(assets.image`enemy ship 1`, SpriteKind.Enemy)
    if (randint(1, 2) == 2) {
        enemy.setImage(assets.image`enemy ship 2`)
    }
    
    enemy.setPosition(start_x, start_y)
    set_offset(enemy)
}

game.onUpdateInterval(7500, function spawn_wave() {
    let start_x = randint(0, 1) * 160
    let start_y = randint(0, 90)
    for (let i = 0; i < randint(3, 6); i++) {
        spawn_enemy(start_x, start_y)
    }
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function destroy_enemy(projectile: Sprite, enemy: Sprite) {
    info.changeScoreBy(100)
    projectile.destroy()
    enemy.destroy(effects.fire, 100)
})
function player_hit(player: Sprite, enemy: Sprite) {
    info.changeLifeBy(-1)
    enemy.destroy()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, player_hit)
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, player_hit)
controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    sprites.createProjectileFromSprite(assets.image`player projectile`, ship, 0, player_shot_speed)
})
function player_movement() {
    if (controller.left.isPressed()) {
        ship.vx -= player_speed
    }
    
    if (controller.right.isPressed()) {
        ship.vx += player_speed
    }
    
    ship.vx *= deceleration
}

function enemy_fire(enemy: Sprite) {
    let proj = sprites.createProjectileFromSprite(assets.image`enemy projectile`, enemy, 0, enemy_shot_speed)
    proj.setKind(SpriteKind.enemy_projectile)
    music.pewPew.play()
}

function update_enemy_position(enemy: Sprite, formation_center: Sprite) {
    let x_offset = sprites.readDataNumber(enemy, "x_offset")
    let y_offset = sprites.readDataNumber(enemy, "y_offset")
    enemy.vx = formation_center.x + x_offset - enemy.x
    enemy.vy = formation_center.y + y_offset - enemy.y
}

function enemy_behaviour() {
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        if (randint(0, 250) == 0) {
            enemy_fire(enemy)
        }
        
        update_enemy_position(enemy, formation_center)
    }
}

function constrain_formation_position() {
    if (formation_center.x < 70) {
        formation_center.vx = randint(5, 10)
    }
    
    if (formation_center.x > 90) {
        formation_center.vx = randint(-5, -10)
    }
    
    if (formation_center.y < 55) {
        formation_center.vy = randint(5, 10)
    }
    
    if (formation_center.y > 65) {
        formation_center.vy = randint(-5, -10)
    }
    
}

game.onUpdate(function tick() {
    player_movement()
    if (sprites.allOfKind(SpriteKind.Enemy).length > 0) {
        enemy_behaviour()
    }
    
    constrain_formation_position()
})