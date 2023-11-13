@namespace
class SpriteKind:
    enemy_projectile = SpriteKind.create()

# variables
deceleration = 0.9
player_speed = 20
player_shot_speed = -100
enemy_shot_speed = 70

# sprites
ship = sprites.create(assets.image("ship"), SpriteKind.player)
ship.y = 108
ship.z = 5
ship.set_stay_in_screen(True)
formation_center = sprites.create(image.create(1, 1))
formation_center.set_bounce_on_wall(True)
formation_center.set_velocity(randint(-10, 10), randint(-10, 10))

# setup
info.set_life(3)
info.set_score(0)
effects.star_field.start_screen_effect()

def set_offset(enemy: Sprite):
    x_offset = randint(-4, 4) * 16
    y_offset = randint(-3, 1) * 16
    sprites.set_data_number(enemy, "x_offset", x_offset)
    sprites.set_data_number(enemy, "y_offset", y_offset)

def spawn_enemy(start_x, start_y):
    enemy = sprites.create(assets.image("enemy ship 1"), SpriteKind.enemy)
    if randint(1, 2) == 2:
        enemy.set_image(assets.image("enemy ship 2"))
    enemy.set_position(start_x, start_y)
    set_offset(enemy)

def spawn_wave():
    start_x = randint(0, 1) * 160
    start_y = randint(0, 90)
    for i in range(randint(3, 6)):
        spawn_enemy(start_x, start_y)
game.on_update_interval(7500, spawn_wave)

def destroy_enemy(projectile, enemy):
    info.change_score_by(100)
    projectile.destroy()
    enemy.destroy(effects.fire, 100)
sprites.on_overlap(SpriteKind.projectile, SpriteKind.enemy, destroy_enemy)

def player_hit(player, enemy):
    info.change_life_by(-1)
    enemy.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, player_hit)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy_projectile, player_hit)

def player_fire():
    sprites.create_projectile_from_sprite(assets.image("player projectile"), ship, 0, player_shot_speed)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def player_movement():
    if controller.left.is_pressed():
        ship.vx -= player_speed
    if controller.right.is_pressed():
        ship.vx += player_speed
    ship.vx *= deceleration

def enemy_fire(enemy: Sprite):
    proj = sprites.create_projectile_from_sprite(assets.image("enemy projectile"), enemy, 0, enemy_shot_speed)
    proj.set_kind(SpriteKind.enemy_projectile)
    music.pew_pew.play()

def update_enemy_position(enemy: Sprite, formation_center: Sprite):
    x_offset = sprites.read_data_number(enemy, "x_offset")
    y_offset = sprites.read_data_number(enemy, "y_offset")
    enemy.vx = (formation_center.x + x_offset - enemy.x)
    enemy.vy = (formation_center.y + y_offset - enemy.y)

def enemy_behaviour():
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        if randint(0, 250) == 0:
            enemy_fire(enemy)
        update_enemy_position(enemy, formation_center)

def constrain_formation_position():
    if formation_center.x < 70:
        formation_center.vx = randint(5, 10)
    if formation_center.x > 90:
        formation_center.vx = randint(-5, -10)
    if formation_center.y < 55:
        formation_center.vy = randint(5, 10)
    if formation_center.y > 65:
        formation_center.vy = randint(-5, -10)

def tick():
    player_movement()
    if len(sprites.all_of_kind(SpriteKind.enemy)) > 0:
        enemy_behaviour()
    constrain_formation_position()
game.on_update(tick)
