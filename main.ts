namespace SpriteKind {
    export const enemy_projectile = SpriteKind.create()
    //  GH2
    export const boss = SpriteKind.create()
}

//  end GH2
//  variables
let deceleration = 0.9
let player_speed = 20
let player_shot_speed = -100
let enemy_shot_speed = 70
//  GH1
let powerup_overheated = false
//  end GH1
//  sprites
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
ship.y = 108
ship.z = 5
ship.setStayInScreen(true)
let formation_center = sprites.create(image.create(1, 1))
formation_center.setBounceOnWall(true)
formation_center.setVelocity(randint(-10, 10), randint(-10, 10))
//  GH1
let powerup_bar = statusbars.create(60, 3, StatusBarKind.Magic)
powerup_bar.setPosition(128, 118)
powerup_bar.max = 100
powerup_bar.value = 0
//  end GH1
//  setup
info.setLife(3)
info.setScore(0)
effects.starField.startScreenEffect()
//  maybe worth refactoring method to allow boss to utilise as well?
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
//  GH2
info.onScore(5000, function spawn_boss() {
    let boss = sprites.create(assets.image`boss`, SpriteKind.boss)
    boss.setPosition(randint(20, 140), -20)
    boss.z = -5
    sprites.setDataNumber(boss, "x_offset", randint(-50, 50))
    sprites.setDataNumber(boss, "y_offset", randint(-5, -25))
    let boss_healthbar = statusbars.create(50, 4, StatusBarKind.Health)
    boss_healthbar.attachToSprite(boss, -5)
    boss_healthbar.max = 100
    boss_healthbar.value = boss_healthbar.max
})
//  end GH2
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function destroy_enemy(projectile: Sprite, enemy: Sprite) {
    //  GH1
    if (!powerup_overheated) {
        powerup_bar.value += 5
    }
    
    //  end GH1
    info.changeScoreBy(100)
    projectile.destroy()
    enemy.destroy(effects.fire, 100)
})
//  GH2
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.boss, function boss_hit(projectile: Sprite, boss: Sprite) {
    let boss_healthbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, boss)
    boss_healthbar.value -= 2
    powerup_bar.value += 5
    if (boss_healthbar.value < 1) {
        boss.destroy(effects.fire)
    }
    
    projectile.destroy()
})
//  end GH2
function player_hit(player: Sprite, enemy: Sprite) {
    info.changeLifeBy(-1)
    enemy.destroy()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, player_hit)
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, player_hit)
controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    sprites.createProjectileFromSprite(assets.image`player projectile`, ship, 0, player_shot_speed)
})
//  GH1
function fire_at_angle(angle: number) {
    let angle_in_radians = spriteutils.degreesToRadians(angle)
    let projectile = sprites.create(assets.image`player projectile`, SpriteKind.Projectile)
    projectile.setPosition(ship.x, ship.y)
    projectile.setFlag(SpriteFlag.AutoDestroy, true)
    spriteutils.setVelocityAtAngle(projectile, angle_in_radians, player_shot_speed)
    music.thump.play()
    pause(20)
}

controller.B.onEvent(ControllerButtonEvent.Pressed, function burst_fire() {
    let launch_angle: number;
    let j: number;
    
    if (powerup_bar.value == powerup_bar.max) {
        powerup_overheated = true
        powerup_bar.value = 0
        powerup_bar.setColor(2, 2)
        launch_angle = 0
        for (let i = 0; i < 2; i++) {
            for (j = 0; j < 18; j++) {
                launch_angle += 10
                fire_at_angle(launch_angle)
            }
            for (j = 0; j < 18; j++) {
                launch_angle -= 10
                fire_at_angle(launch_angle)
            }
        }
        powerup_cooldown()
    }
    
})
function powerup_cooldown() {
    
    pause(5000)
    powerup_overheated = false
    powerup_bar.setColor(8, 11)
    music.jumpUp.play()
}

//  end GH1
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

//  GH2
function boss_behaviour() {
    let lasers: Sprite[];
    let boss_sprite = sprites.allOfKind(SpriteKind.boss)[0]
    update_enemy_position(boss_sprite, formation_center)
    if (randint(0, 120) == 120) {
        sprites.setDataNumber(boss_sprite, "x_offset", randint(-50, 50))
        sprites.setDataNumber(boss_sprite, "y_offset", randint(-5, -25))
    }
    
    if (randint(0, 60) == 60) {
        enemy_fire(boss_sprite)
        lasers = sprites.allOfKind(SpriteKind.enemy_projectile)
        lasers[lasers.length - 1].scale = 5
    }
    
}

//  end GH2
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
    
    //  GH2
    if (sprites.allOfKind(SpriteKind.boss).length > 0) {
        boss_behaviour()
    }
    
    //  end GH2
    constrain_formation_position()
})
