# Dream of Sheep

An isometric shepherding demo where you guide a flock across a large mountainside field into a gated pen.

## Features

### Visual Elements
- **Responsive Isometric Terrain**: Dynamic grid with valley/hill shaping that creates natural elevation changes
- **Layered Mountain Silhouettes**: Three layers of mountains in the background for enhanced depth perception
- **Stylized Trees**: Scattered across the field with simple geometric shapes
- **Animated Sheep**: Fluffy white sheep with animated stick legs that move as they walk
- **Shepherd Character**: Controllable character with a staff that indicates facing direction

### Interactive Elements
- **Orange Gate (G key)**: Toggle the pen gate open and closed to let sheep in and out
- **Food Piles**: Golden food piles in the pen to attract sheep
- **Responsive Controls**: Use WASD or Arrow Keys to move the shepherd around the field

### Sheep AI Behaviors
The sheep exhibit realistic flocking behaviors:
- **Flee Behavior**: Sheep run away when the shepherd gets too close
- **Cohesion**: Sheep move toward the center of nearby flock members
- **Alignment**: Sheep match the velocity of nearby flock members
- **Separation**: Sheep avoid crowding each other
- **Scatter Roaming**: Random wandering when not influenced by other behaviors

### Debug Mode (D key)
Press D to toggle an advanced debug panel featuring:
- **Grid Overlay**: Visual coordinate grid on the terrain
- **Build Info**: Real-time statistics (sheep count, shepherd position, gate status, FPS)
- **Live Behavior Sliders**: Adjust AI parameters in real-time:
  - Flee Distance: How far the shepherd must be before sheep feel safe
  - Flee Speed: How fast sheep run from the shepherd
  - Cohesion: Strength of attraction to nearby sheep
  - Alignment: How much sheep match velocity with neighbors
  - Separation: How strongly sheep avoid crowding
  - Wander: Amount of random movement
- **YAML Export/Import**: Save and load behavior presets as YAML configuration

## How to Play

1. Open `index.html` in a web browser
2. Use **WASD** or **Arrow Keys** to move the shepherd
3. Guide the sheep toward the pen in the upper-right corner
4. Press **G** to open the gate when sheep are nearby
5. Press **D** to access debug mode and experiment with AI parameters

## Technical Details

- Pure HTML5 Canvas implementation with JavaScript
- Isometric projection for 3D appearance on 2D canvas
- Painter's algorithm for proper depth sorting
- Real-time flocking simulation using steering behaviors
- No external dependencies required

## Screenshots

![Game Screenshot](https://github.com/user-attachments/assets/3c7a9865-6203-4564-92ea-166ba82f0ddf)
*Main game view with layered mountain background and isometric terrain*

![Debug Mode](https://github.com/user-attachments/assets/bc0af494-efbd-4d94-8e33-dafe6856039a)
*Debug mode showing grid overlay and behavior parameter sliders*

![Gate Open](https://github.com/user-attachments/assets/0bc921b6-2334-48a6-8cc2-c1506aeb59e6)
*Orange gate opened with YAML configuration exported*

## License

See LICENSE file for details.
