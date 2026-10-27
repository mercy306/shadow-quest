export class DialogueManager {
  constructor(uiManager = null, questSystem = null, merchantManager = null, audioManager = null) {
    this.uiManager = uiManager;
    this.questSystem = questSystem;
    this.merchantManager = merchantManager;
    this.audioManager = audioManager;

    this.activeNPC = null;
    this.player = null;
    this.currentNode = null;
    this.isOpen = false;
    this.flags = new Set(); // persistent dialogue flags, e.g. 'met_sylas'
  }

  setManagers({ uiManager, questSystem, merchantManager, audioManager }) {
    if (uiManager) this.uiManager = uiManager;
    if (questSystem) this.questSystem = questSystem;
    if (merchantManager) this.merchantManager = merchantManager;
    if (audioManager) this.audioManager = audioManager;
  }

  isDialogueActive() {
    return this.isOpen;
  }

  startDialogue(npc, player) {
    if (!npc) return;
    this.activeNPC = npc;
    this.player = player;
    this.isOpen = true;

    // Gesture animation on NPC if available
    if (npc.hasRiggedAnimations) {
      if (npc.role === 'merchant') npc.playAnimation('agree');
      else npc.playAnimation('Wave');
    }

    const startNode = this.buildDialogueTree(npc);
    this.renderNode(startNode);

    if (this.uiManager && typeof this.uiManager.openDialogueModal === 'function') {
      this.uiManager.openDialogueModal(this);
    }
  }

  buildDialogueTree(npc) {
    const qSys = this.questSystem;
    const choices = [];

    // --- 1. ELDER KAELEN (QUEST GIVER) ---
    if (npc.role === 'quest_giver' || npc.id === 'npc-kaelen') {
      const qGrimfang = qSys?.getSideQuest('side-bane-grimfang');
      const qGrotto = qSys?.getSideQuest('side-sunken-grotto');

      let greeting = 'Greetings, brave traveler. The ancient woods are shadowed by corruption, but your presence brings new hope to our people.';

      if (qSys?.isEntranceUnlocked) {
        greeting = 'The sanctuary portal is blazing with celestial light! The glade barrier has dissolved. Step through the Altar Portal whenever you are prepared to confront the Ancient Ruins!';
      }

      // Check for ready turn-ins first!
      if (qGrimfang && qGrimfang.status === 'READY_TO_TURN_IN') {
        greeting = 'You have slain Grimfang! The howls of that terrible beast have ceased. The western hollow is safe once more. Take this reward, champion!';
        choices.push({
          text: '🏆 [Turn in Quest] Hand in Grimfang trophy & claim bounty',
          action: () => {
            qSys.completeSideQuest('side-bane-grimfang', this.player);
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'May this steel blade serve you well. You have the gratitude of every soul in the sanctuary.',
              choices: [{ text: 'Farewell, Elder.', action: () => this.closeDialogue() }]
            });
          }
        });
      }

      if (qGrotto && qGrotto.status === 'READY_TO_TURN_IN') {
        greeting = 'You discovered the sacred Sunken Grotto! The ancestral altar still stands after all these centuries. You have rekindled our ancient lineage!';
        choices.push({
          text: '🏆 [Turn in Quest] Report Sunken Grotto discovery & claim reward',
          action: () => {
            qSys.completeSideQuest('side-sunken-grotto', this.player);
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Take this Windrunner Tonic and gold. The path forward is clearing, noble warrior.',
              choices: [{ text: 'Thank you, Elder. Farewell.', action: () => this.closeDialogue() }]
            });
          }
        });
      }

      // In-progress or Available: Grimfang
      if (qGrimfang && qGrimfang.status === 'AVAILABLE') {
        choices.push({
          text: '📜 [Side Quest] "Do you need help with the dangers here?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'A ferocious alpha shadow beast named Grimfang stalks the western thicket. It has ambushed our scouts and grows stronger by the day. Will you hunt down Grimfang?',
              choices: [
                {
                  text: '⚔️ Accept Quest: "I will hunt down Grimfang and slay the beast."',
                  action: () => {
                    qSys.acceptSideQuest('side-bane-grimfang');
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'Tread with care. Grimfang lurks in the mist-shrouded hollow to the west. May your blade strike true!',
                      choices: [{ text: 'Understood. Farewell.', action: () => this.closeDialogue() }]
                    });
                  }
                },
                {
                  text: 'Perhaps later.',
                  action: () => this.startDialogue(this.activeNPC, this.player)
                }
              ]
            });
          }
        });
      } else if (qGrimfang && qGrimfang.status === 'ACTIVE') {
        choices.push({
          text: '⚔️ [Quest Progress] "Where did you say Grimfang was seen?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Grimfang prowls the mist-shrouded western hollow. Watch for dark claw marks along the ancient roots and prepare for a vicious ambush.',
              choices: [
                {
                  text: 'I will hunt the beast down.',
                  action: () => this.startDialogue(this.activeNPC, this.player)
                },
                {
                  text: '⚠️ [Abandon Quest] "The danger is too great. I cannot continue."',
                  action: () => {
                    qSys.abandonSideQuest('side-bane-grimfang', this.player);
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'A heavy choice, but survival comes first. Return to me if your resolve strengthens.',
                      choices: [{ text: 'Farewell, Elder.', action: () => this.closeDialogue() }]
                    });
                  }
                }
              ]
            });
          }
        });
      } else if (qGrimfang && qGrimfang.status === 'COMPLETED') {
        choices.push({
          text: '🐺 "Has there been any sign of more shadow beasts?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Thanks to your courage, Grimfang is slain and the western paths are quiet. Our scouts can breathe easy.',
              choices: [{ text: 'Glad to help.', action: () => this.startDialogue(this.activeNPC, this.player) }]
            });
          }
        });
      }

      // In-progress or Available: Sunken Grotto
      if (qGrotto && qGrotto.status === 'AVAILABLE') {
        choices.push({
          text: '🗺️ [Side Quest] "Tell me of the lost lore of this region."',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Legends speak of the Sunken Grotto Shrine hidden beyond the western crags. It was our sanctuary’s ceremonial heart. If you can discover its location, our ancestral magic may awaken.',
              choices: [
                {
                  text: '🧭 Accept Quest: "I will venture out and discover the Sunken Grotto."',
                  action: () => {
                    qSys.acceptSideQuest('side-sunken-grotto');
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'Look for ancient rune pillars near the western rock boundary. Safe travels, seeker.',
                      choices: [{ text: 'I am on my way.', action: () => this.closeDialogue() }]
                    });
                  }
                },
                {
                  text: 'I have other tasks first.',
                  action: () => this.startDialogue(this.activeNPC, this.player)
                }
              ]
            });
          }
        });
      } else if (qGrotto && qGrotto.status === 'ACTIVE') {
        choices.push({
          text: '🧭 [Quest Progress] "Any hints on finding the Sunken Grotto?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Travel west toward the boundary cliffs. The grotto lies partially submerged beneath ancient rune arches.',
              choices: [
                { text: 'I will continue searching.', action: () => this.startDialogue(this.activeNPC, this.player) },
                {
                  text: '⚠️ [Abandon Quest] "I must abandon this expedition."',
                  action: () => {
                    qSys.abandonSideQuest('side-sunken-grotto', this.player);
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'The grotto has slept for centuries; it will wait until you are prepared.',
                      choices: [{ text: 'Understood.', action: () => this.closeDialogue() }]
                    });
                  }
                }
              ]
            });
          }
        });
      } else if (qGrotto && qGrotto.status === 'COMPLETED') {
        choices.push({
          text: '🏛️ "What will become of the Sunken Grotto now?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Our scholars have already begun transcribing the sacred glyphs you uncovered. Your discovery will be remembered for generations.',
              choices: [{ text: 'It was an honor.', action: () => this.startDialogue(this.activeNPC, this.player) }]
            });
          }
        });
      }

      // Lore option
      choices.push({
        text: '💬 "What must I do to break the forest barrier?"',
        action: () => {
          this.renderNode({
            speaker: npc.name,
            title: npc.title,
            avatar: npc.avatar,
            text: 'You must cleanse the corrupted guardians and collect the glowing relic crystals scattered across the glades. Once collected, the ancient stone portal at the altar will unlock!',
            choices: [{ text: 'Thank you for the guidance.', action: () => this.startDialogue(this.activeNPC, this.player) }]
          });
        }
      });

      choices.push({
        text: '👋 "Farewell, Elder."',
        action: () => this.closeDialogue()
      });

      return {
        speaker: npc.name,
        title: npc.title,
        avatar: npc.avatar,
        text: greeting,
        choices
      };
    }

    // --- 2. VALEN (MERCHANT) ---
    if (npc.role === 'merchant' || npc.id.includes('valen')) {
      return {
        speaker: npc.name,
        title: npc.title,
        avatar: npc.avatar,
        text: 'Greetings, traveler! Few venture this deep into the wild. My pack is brimming with restorative elixirs, tempered gear, and rare minerals. Care to trade?',
        choices: [
          {
            text: '🪙 [Browse Wares] "Show me what you have in stock."',
            action: () => {
              this.closeDialogue(false);
              if (this.merchantManager) {
                this.merchantManager.openShop(npc, this.player);
              }
            }
          },
          {
            text: '💬 "How do you manage to trade out here alone?"',
            action: () => {
              this.renderNode({
                speaker: npc.name,
                title: npc.title,
                avatar: npc.avatar,
                text: 'Shadow beasts don’t care for gold, but they fear quick feet and flash powder! Keep a few Windrunner Tonics handy and you’ll slip past anything.',
                choices: [
                  { text: '🪙 "Let me see your supplies then."', action: () => {
                    this.closeDialogue(false);
                    if (this.merchantManager) this.merchantManager.openShop(npc, this.player);
                  }},
                  { text: 'Good to know. Farewell.', action: () => this.closeDialogue() }
                ]
              });
            }
          },
          {
            text: '👋 "Farewell, Valen."',
            action: () => this.closeDialogue()
          }
        ]
      };
    }

    // --- 3. SYLAS (FOREST HERMIT) ---
    if (npc.role === 'forest_hermit' || npc.id.includes('sylas')) {
      const qSatchel = qSys?.getSideQuest('side-hermit-satchel');
      let text = 'Hush... the ancient trees whisper when footsteps tread the loam. Peace to you, traveler.';

      // Gift on first meet
      if (!this.flags.has('met_sylas')) {
        this.flags.add('met_sylas');
        if (this.player?.inventorySystem) {
          const potion = this.player.inventorySystem.createItem('healing_potion');
          if (potion) this.player.inventorySystem.addItem(potion, 1);
        }
        text = 'Welcome to my humble grove. The miasma is thick today—take this Healing Elixir as a gesture of goodwill.';
      }

      if (qSatchel && qSatchel.status === 'READY_TO_TURN_IN') {
        text = 'By the moss and roots, you found my Lost Satchel! The rare curative flora are completely unharmed. A thousand thanks!';
        choices.push({
          text: '🏆 [Turn in Quest] Hand over the Alchemy Satchel',
          action: () => {
            qSys.completeSideQuest('side-hermit-satchel', this.player);
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'You have a noble spirit. May the ancient groves shield you on your journey!',
              choices: [{ text: 'Farewell, Sylas.', action: () => this.closeDialogue() }]
            });
          }
        });
      } else if (qSatchel && qSatchel.status === 'AVAILABLE') {
        choices.push({
          text: '📜 [Side Quest] "You seem distressed. Is something wrong?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'A band of prowling void horrors ambushed me near the northwest overgrown ruins! In my haste, I dropped my Alchemy Satchel containing all my medicinal herbs. Could you retrieve it for me?',
              choices: [
                {
                  text: '🌿 Accept Quest: "I will search the northwest ruins and find your satchel."',
                  action: () => {
                    qSys.acceptSideQuest('side-hermit-satchel');
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'Bless you, wanderer! Look for a glowing leather satchel near the collapsed stone archway.',
                      choices: [{ text: 'I will return with it soon.', action: () => this.closeDialogue() }]
                    });
                  }
                },
                {
                  text: 'Not right now.',
                  action: () => this.startDialogue(this.activeNPC, this.player)
                }
              ]
            });
          }
        });
      } else if (qSatchel && qSatchel.status === 'ACTIVE') {
        choices.push({
          text: '🎒 [Quest Progress] "Where exactly did you drop your satchel?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'Near the northwest collapsed stone archway. Keep your eyes peeled for a glowing leather bag among the roots.',
              choices: [
                { text: 'I am searching the ruins for it.', action: () => this.startDialogue(this.activeNPC, this.player) },
                {
                  text: '⚠️ [Abandon Quest] "I cannot search the ruins right now."',
                  action: () => {
                    qSys.abandonSideQuest('side-hermit-satchel', this.player);
                    this.renderNode({
                      speaker: npc.name,
                      title: npc.title,
                      avatar: npc.avatar,
                      text: 'I understand... The horrors in those ruins are terrifying. Let me know if you muster the courage.',
                      choices: [{ text: 'Farewell, Sylas.', action: () => this.closeDialogue() }]
                    });
                  }
                }
              ]
            });
          }
        });
      } else if (qSatchel && qSatchel.status === 'COMPLETED') {
        choices.push({
          text: '🌿 "How are the medicinal herbs holding up?"',
          action: () => {
            this.renderNode({
              speaker: npc.name,
              title: npc.title,
              avatar: npc.avatar,
              text: 'The sun-moss and star-orchids are drying splendidly. My gratitude remains eternal, traveler.',
              choices: [{ text: 'May the forest protect you.', action: () => this.startDialogue(this.activeNPC, this.player) }]
            });
          }
        });
      }

      choices.push({
        text: '💬 "Tell me about the medicinal plants of this forest."',
        action: () => {
          this.renderNode({
            speaker: npc.name,
            title: npc.title,
            avatar: npc.avatar,
            text: 'Sun-kissed moss restores vitality when boiled with spring water, while starry orchids brew into potent draughts of swiftness.',
            choices: [{ text: 'Fascinating. Thank you.', action: () => this.startDialogue(this.activeNPC, this.player) }]
          });
        }
      });

      choices.push({
        text: '👋 "Farewell, Sylas."',
        action: () => this.closeDialogue()
      });

      return {
        speaker: npc.name,
        title: npc.title,
        avatar: npc.avatar,
        text,
        choices
      };
    }

    // Default Fallback
    return {
      speaker: npc.name,
      title: npc.title,
      avatar: npc.avatar,
      text: 'Safe travels on the path ahead, adventurer.',
      choices: [{ text: 'Farewell.', action: () => this.closeDialogue() }]
    };
  }

  renderNode(node) {
    this.currentNode = node;
    if (this.uiManager && typeof this.uiManager.renderDialogueNode === 'function') {
      this.uiManager.renderDialogueNode(node);
    }
  }

  selectChoice(index) {
    if (!this.currentNode || !this.currentNode.choices || !this.currentNode.choices[index]) {
      return;
    }
    const choice = this.currentNode.choices[index];
    if (typeof choice.action === 'function') {
      choice.action();
    }
  }

  closeDialogue(notifyUI = true) {
    this.isOpen = false;
    this.currentNode = null;
    this.activeNPC = null;

    if (notifyUI && this.uiManager && typeof this.uiManager.closeDialogueModal === 'function') {
      this.uiManager.closeDialogueModal();
    }
  }

  getSaveState() {
    return {
      flags: Array.from(this.flags)
    };
  }

  restoreSaveState(state) {
    if (!state) return;
    if (Array.isArray(state.flags)) {
      this.flags = new Set(state.flags);
    }
  }
}
