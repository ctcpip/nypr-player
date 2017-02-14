import Ember from 'ember';
import service from 'ember-service/inject';
import computed, { reads } from 'ember-computed';
import get from 'ember-metal/get';
import { debounce } from 'ember-runloop';
import layout from '../templates/components/nypr-player';
import KeyboardCommandMixin from '../mixins/keyboard-command-mixin';

export default Ember.Component.extend(KeyboardCommandMixin, {
  layout,
  hifi                  : service(),
  classNames            : ['nypr-player'],
  classNameBindings     : ['isAudiostream'],
  attributeBindings     : ['tabindex', 'aria-label'],
  tabindex              : 0,
  "aria-label"          : computed('currentTitle', function() {
    let currentTitle = get(this, 'currentTitle');
    if (currentTitle) {
      return `Audio Player - Now playing: ${currentTitle}`
    } else {
      return 'Audio Player'
    }
  }),

  isReady               : reads('hifi.isReady'),
  isPlaying             : reads('hifi.isPlaying'),
  isLoading             : reads('hifi.isLoading'),
  isAudiostream         : reads('hifi.isStream'),

  currentTitle          : null,

  autofocus             : false,
  didInsertElement() {
    // focus on first launch
    if (get(this, 'autofocus')) {
      this.$().focus();
    }
  },

  playState             : computed('isPlaying', 'isLoading', function() {
    if (get(this, 'isLoading')) {
      return 'is-loading';
    } else if (get(this, 'isPlaying')) {
      return 'is-playing';
    } else {
      return 'is-paused';
    }
  }),
  
  init() {
    this._super(...arguments);

    let audioToLoad = this.get('sound');
    if (audioToLoad) {
      let hifi = get(this, 'hifi');
      hifi.load(audioToLoad).then(({sound}) => hifi.setCurrentSound(sound));
    }
  },

  actions: {
    playOrPause() {
      if (get(this, 'isPlaying')) {
        this.sendAction('onPause');
        get(this, 'hifi').togglePause();
      } else {
        this.sendAction('onPlay');
        get(this, 'hifi').togglePause();
      }
    },
    setPosition(p) {
      this.sendAction('onSetPosition');
      get(this, 'hifi').set('position', (p * get(this, 'hifi.currentSound.duration')));
    },
    rewind() {
      this.sendAction('onRewind');
      get(this, 'hifi').rewind(15000);
    },
    fastForward() {
      this.sendAction('onFastForward');
      get(this, 'hifi').fastForward(15000);
    },
    setVolume(vol) {
      get(this, 'hifi').set('volume', vol);
    },
    toggleMute() {
      get(this, 'hifi').toggleMute();
    },
  },

  keyboardKeys: {
    volumeUp:    ['ArrowUp'],
    volumeDown:  ['ArrowDown'],
    rewind:      ['ArrowLeft'],
    fastForward: ['ArrowRight'],
  },

  keyboardCommands: {
    volumeUp: {
      keydown() {
        this.send('setVolume', get(this, 'hifi.volume') + 6);
        this.set('isChangingVolume', true);
      },
      keyup() {
        debounce(this, this.set, 'isChangingVolume', false, 1000);
      }
    },
    volumeDown: {
      keydown() {
        this.send('setVolume', get(this, 'hifi.volume') - 6);
        this.set('isChangingVolume', true);
      },
      keyup() {
        debounce(this, this.set, 'isChangingVolume', false, 1000);
      }
    },
    rewind: {
      keydown() {
        this.send('rewind');
        this.set('isRewinding', true);
      },
      keyup() {
        this.set('isRewinding', false);
      },
    },
    fastForward: {
      keydown() {
        this.send('fastForward');
        this.set('isFastForwarding', true);
      },
      keyup() {
        this.set('isFastForwarding', false);
      }
    }
  }
});
