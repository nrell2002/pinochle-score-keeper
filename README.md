# 🃏 Pinochle Score Keeper

Keep score of your pinochle game(s)! A responsive web application that works perfectly on both desktop and mobile devices.

## 🆕 Recent Updates

**Version 1.0 - Modular Architecture Refactor**
- Completely refactored from monolithic vanilla JavaScript to modern modular architecture
- Improved maintainability and extensibility for team development
- Enhanced error handling and user experience
- Full backward compatibility maintained
- Ready for marketplace deployment

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

## Features

✅ **Player Management**
- Add and remove players
- Persistent storage of player data
- Player statistics tracking

✅ **Multi-Game Support**
- 2-player games (target: 1000 points)
- 3-player games (target: 1500 points)  
- 4-player team games (target: 1500 points)

✅ **Complete Score Tracking**
- Record winning bids for each hand
- Track meld points for all players
- Record hand scores (points taken)
- Automatic score calculation and totaling

✅ **Player Statistics**
- Games played and won
- Win rate percentage
- Highest scoring hand
- Highest bid made
- Average scores and meld

✅ **Responsive Design**
- Works perfectly on desktop computers
- Optimized for mobile phones and tablets
- Clean, intuitive interface

✅ **Data Persistence**
- All data saved locally in browser
- No internet connection required
- Game history preserved

✅ **Modern Architecture**
- Modular ES6 code structure
- Event-driven architecture
- Comprehensive error handling
- Ready for team development

## How to Use

1. **Add Players**: Start by adding players in the Players tab
2. **Setup Game**: Choose 2, 3, or 4 players and select game type
3. **Play Game**: Record each hand's bid, meld, and scores
4. **View Stats**: Check player statistics and performance

## Getting Started

### Quick Start
Simply open `index.html` in any modern web browser. No installation or setup required!

### Development Setup
```bash
# Clone the repository
git clone https://github.com/nrell2002/pinochle-score-keeper.git
cd pinochle-score-keeper

# Start development server
npm run dev
# or
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

For best experience on mobile, add the app to your home screen for a native app-like experience.

## Browser Support

### Modern Browsers (Full Features)
- Chrome 80+ / Chromium
- Firefox 75+
- Safari 13+
- Edge 80+

### Legacy Browsers (Basic Features)
- Internet Explorer 11
- Older Chrome/Firefox versions
- Automatic compatibility mode with graceful degradation

## Architecture

The application uses a modern modular architecture:

- **Models**: Player, Game, GameHand with business logic
- **Services**: Storage, Notifications, Events
- **Controllers**: Player, Game, UI, Stats management
- **Utilities**: Validation, formatting, configuration

This structure enables:
- Easy team collaboration
- Feature isolation and testing
- Scalable development
- Marketplace-ready deployment

## Game Rules Supported

- Standard pinochle scoring
- Configurable target scores (1000 for 2-player, 1500 for 3-4 player)
- Bid tracking and winner determination
- Complete hand-by-hand score recording
- Meld safety rules (9's of trump)
- Set detection and scoring

## Development

### Contributing
1. Check out the [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
2. Follow the modular structure when adding features
3. Maintain backward compatibility
4. Add appropriate tests

### Roadmap
- [ ] Unit testing suite
- [ ] Tournament mode
- [ ] Advanced statistics
- [ ] Offline PWA capabilities
- [ ] Cloud sync (premium feature)
- [ ] Theme customization

## License

MIT License - see LICENSE file for details.

## Support

- Create an issue on GitHub for bugs or feature requests
- Check existing issues before creating new ones
- Contributions welcome!
