class Utils {
  flat2d(array) {
    let new_array = []
    for (const el of array) {
      if (el instanceof Array) {
        for (const _el of el) {
          new_array.push(_el) 
        }
      } else {
        new_array.push(el)
      }
    }
    return new_array
  }

  intersection(setA, setB) {
    var _intersection = []
    for (var elem of setB) {
      if (setA.includes(elem)) {
        _intersection.push(elem);
      }
    }
    return _intersection;
  }
}

const fab = Vue.component("fab-done", {
  props: [
    'isFabDisabled',
    'isMyClasses',
    'isOtherClasses',
    'isSectionChoser'
  ],
  methods: {
    handle(event) {
      if (this.isMyClasses) {
        this.$emit('done-with-my-classes')
      } else if (this.isSectionChoser) {
        this.$emit('done-with-sections')
      } else if (this.isOtherClasses) {
        this.$emit('done-with-a-class')
      }
    }
  },
  template: `
    <div id="next" class="fixed-action-btn">
      <a class="btn-floating btn-large" :class="{disabled: isFabDisabled}" @click="handle">
        <i class="large material-icons">done</i>
      </a>
    </div>
  `
}) 

const table = Vue.component('time-table', {
  props: [
    "isTimeTableInputEnabled",
    "highlightable",
    "isLegendNeeded"
  ], 
  data: function() {
    return {
      slotSize: "single",
      currentArray: [],
      section_name: '',
      error : true,
      localTableName: "",
      slots: this._slots()
    }
  },
  watch: {
    section_name(new_val, old_val) {
      this.error = new_val.length <= 0
      this.error ? this.$emit('disable-fab') : this.$emit("enable-fab")
    },
    highlightable : {
      handler: 'highlight',
      immediate: true
    }
  },
  methods: {
    _slots() {
      const _slots = {}
      for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
        let lower_case_slots = day.toLowerCase()
        _slots[lower_case_slots] = { name: day }
        _slots[lower_case_slots]['slot_times'] = []
        for (const slot_time of [...Array(8).keys()]) {
          let id = slot_time 
          let q_name = day.toLowerCase() + '-' + (id + 1)
          let obj = {
            name: day,
            q_name: q_name,
            id: id,
            selected: false,
            selected_g: false,
            highlight_our_g: false,
            highlight_our: false,
            highlight_their: false,
            highlight_their_g: false,
            highlight_clash: false
          }
          _slots[lower_case_slots]['slot_times'].push(obj) 
        }
      }
      return _slots
    },
    getSlot(q_name) {
      let qndname = q_name.split('-')
      return this.slots[qndname[0]].slot_times[parseInt(qndname[1]) - 1]
    }, 
    highlight() {
      if (Object.keys(this.highlightable).length > 1) {
        let that = this.highlightable
        for (const _class of that.myClasses) {
          if (_class instanceof Array) {
            for (const _c of _class) {
              // highlight our group slots
              this.getSlot(_c).highlight_our_g = true
            } 
          } else {
            // highlight our single slots 
            this.getSlot(_class).highlight_our = true
          }
        }

        this.localTableName = that.other_section.name
        for (const _class of that.other_section.schedule) {
          if (_class instanceof Array) {
            for (const _c of _class) {
              // highlight their group slots
              this.getSlot(_c).highlight_their_g = true
            } 
          } else {
            // highlight their single slots
            this.getSlot(_class).highlight_their = true
          }
        }

        for (const _clash of that.other_section.clash) {
          // highlight the clashes
          // we have to highlight the group slots if one of those have the clash
          let this_slot = this.getSlot(_clash)

          if (this_slot.highlight_their_g) {
            // means it is in a group, we have to find that group
            for (const _class of that.other_section.schedule) {
              if (_class instanceof Array) {
                if (_class.indexOf(this_slot.q_name) >= 0) {
                  // it is the grouped slot that we need to highlight
                  for (const _c of _class) {
                    this.getSlot(_c).highlight_clash = true 
                  }
                  break
                }
              }
            }
          } else {
            this_slot.highlight_clash = true
          }
        }
      }
    },
    clicked(current_slot) {
      let next_slot = null;
      if (this.slotSize == "grouped") {
        if (current_slot.id >= 0 && current_slot.id < 8) {
          next_slot = this.slots[current_slot.name.toLowerCase()].slot_times[(current_slot.id) + 1]
        }
      }

      let index
      if (this.slotSize == "single") {
        if ((index = this.currentArray.indexOf(current_slot.q_name)) < 0 && !(current_slot.selected_g)) {
          // means it doesn't exists in the flat array and not even taken in a group
          current_slot.selected = true
          this.currentArray.push(current_slot.q_name)
        } else if (index >- 1) {
          current_slot.selected = false 
          this.currentArray.splice(index, 1)
        }
      } else if (this.slotSize == "grouped") {
        if (!(current_slot.selected_g || current_slot.selected)) {
          if (next_slot) {
            if ((this.currentArray.indexOf(next_slot.q_name) < 0) && !next_slot.selected_g) {
              // if the next slot isn't in the flat array and it doesn't have a selected_g (meaning not
              // in any other group)
              current_slot.selected_g = true
              next_slot.selected_g = true
              this.currentArray.push([current_slot.q_name, next_slot.q_name])
            }
          }
        } else {
          // else if the current slot is selected_g, then next slot will too, find those and remove them
          for (const [index, slot] of this.currentArray.entries()) {
            if (slot instanceof Array) {
              if (slot[0] == current_slot.q_name) {
                for (const q_name of slot) {
                  this.getSlot(q_name).selected_g = false
                }
                this.currentArray.splice(index, 1)
                break
              }
            }
          }
        }
      }
       if (this.currentArray.length > 0 && !this.error) {
        this.$emit('enable-fab')
      } else {
        this.$emit('disable-fab')
      }
    }
  },
  template: `
    <div id="time-table-wrapper">
      <div class="time-table-wrapper container">
        <div v-if="isTimeTableInputEnabled">
          <div id="class-title">
            <div class="input-field">
              <input id="section_name" required type="text" v-model.trim="section_name" class="validate">
              <label for="section_name">Section Name</label>
            </div>
          </div>
          <transition name="fade">
            <div class="section-name-error" v-if="error">
              <p>Please fill out this field</p>
            </div>
          </transition>
          <div id="slot-duration-choser">
            <p>
              <label>
                <input name="group1" value="single" type="radio" v-model="slotSize" checked />
                <span>Single Slot</span>
              </label>
            </p>
            <p>
              <label>
                <input name="group1" type="radio" value="grouped" v-model="slotSize" class="grouped-slot" />
                <span>Grouped Slot</span>
              </label>
            </p>
          </div>
        </div>
        <!-- table name -->
        <div id="table-name" v-if="localTableName">
          <h4>{{ localTableName }}</h4>
        </div>
        <div id="legend-wrapper" v-if="isLegendNeeded">
          <ul>
            <li><span class="color-preview highlight-our"></span><span class="legend-color-text">Your Single Slots</span></li>
            <li><span class="color-preview highlight-our-g"></span><span class="legend-color-text">Your Double Slots</span></li>
            <li><span class="color-preview highlight-their"></span><span class="legend-color-text">Their Single Slot</span></li>
            <li><span class="color-preview highlight-their-g"></span><span class="legend-color-text">Their Double Slot</span></li>
            <li><span class="color-preview highlight-clash"></span><span class="legend-color-text">Clash</span></li>
          </ul>
        </div>
      </div>
      <br>
      <table class="time-table" border>
        <thead>
          <tr>
            <th></th>
            <th><span class="slot-no">1</span><br><span class="slot-time">8:30 - 10:00</span></th>
            <th><span class="slot-no">2</span><br><span class="slot-time">10:00-11:30</span></th>
            <th><span class="slot-no">3</span><br><span class="slot-time">11:30-1:00</span></th>
            <th><span class="slot-no">4</span><br><span class="slot-time">1:00-2:30</span></th>
            <th><span class="slot-no">5</span><br><span class="slot-time">2:30-4:00</span></th>
            <th><span class="slot-no">6</span><br><span class="slot-time">4:00-5:30</span></th>
            <th><span class="slot-no">7</span><br><span class="slot-time">5:30-7:00</span></th>
            <th><span class="slot-no">8</span><br><span class="slot-time">7:00-8:30</span></th>
          </tr>
        </thead> 
        <tbody>
          <tr v-for="slot in slots">
            <th>{{ slot.name }}</th>
            <td v-for="slot_time in slot.slot_times"
              v-on="isTimeTableInputEnabled ? {click: () => clicked(slot_time)} : {}"
              class="waves-effect"
              v-bind:class="{
                'selected': slot_time.selected,
                'selected-g': slot_time.selected_g, 
                'highlight-our': slot_time.highlight_our,
                'highlight-our-g': slot_time.highlight_our_g,
                'highlight-their': slot_time.highlight_their,
                'highlight-their-g': slot_time.highlight_their_g,
                'highlight-clash': slot_time.highlight_clash
              }">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})

const sectionTextField = Vue.component("section-text-field", {
  data: function () {
    return {
      sectionsLocalModel: 0
    } 
  },
  props: [

  ],
  watch: {
    sectionsLocalModel(new_num, old_num) {
      this.$emit('update-sections', new_num)
    }
  },
  template: `
    <div class="section-selector container">
      <div class="input-field">
        <input v-model.number="sectionsLocalModel" id="other_sections" type="number" max="10" min="1" class="validate">
      </div>
    </div>
  `
})

const app = new Vue({
  el: "#app",
  data : {
    instruction: "Tell me your entire schedule",
    sub_instruction: '',
    sections: 0,
    howManyTables: [{key: 0}],
    isTimeTableInputRequired: true,
    isTimeTableInputEnabled: true,
    isSectionChoser: false,
    isLegendNeeded: false,
    isFabDisabled: true,
    isMyClasses: true,
    isOtherClasses: false,
    myClassName: '',
    myClasses: [],
    otherClasses: [],
    clashes: [],
    totalClashes: 0,
    utils: new Utils()
  },
  components: {
    'fab-done': fab,
    'time-table': table
  },
  methods: {
   ukey() {
    return this.howManyTables[0].key++
   },
   scrollToTop() {
    this.$scrollTo("#app")
   },
   doneWithMyClasses() {
      // get the result array from the table component into our root
      this.myClasses = this.$refs.table[0].currentArray
      this.myClassName = this.$refs.table[0].section_name
      // console.log(this.myClasses, this.myClassName)
      // disable my class
      this.isMyClasses = false
      // time table is not required since we want to get the number of sections now
      this.isTimeTableInputRequired = false
      // fab is disabled initiallyj
      this.isFabDisabled = true
      // show the section chooser
      this.isSectionChoser = true
      // set its new instruction
      this.instruction = "How many other sections are taking that course?"
      // increase the key
      this.ukey()
    },
    doneWithSections() {
      // disable the section chooser
      this.isSectionChoser = false
      // now we have to ask the schedule for other classes
      this.isOtherClasses = true
      this.isFabDisabled = true
      // set new instructions
      this.instruction = "Tell me the schedule of that class you want to take in the section"
      this.sub_instruction = "Remember that I only want the schedule of only that one class you want to take with that section"
      // turn timetable input component on
      this.isTimeTableInputRequired = true
      this.scrollToTop()
    },
    enableFab() {
      this.isFabDisabled = false
    },
    disableFab() {
      this.isFabDisabled = true
    },
    updateSections(sections) {
      this.sections = sections
      this.isFabDisabled = (this.sections <= 0 || this.sections > 10)
    },
    doneWithAClass() {
      M.toast({html: `Sucessfully Added`, displayLength: 1000})
      this.scrollToTop()
      this.isFabDisabled = true
      this.otherClasses.push( 
         { 
           name: this.$refs.table[0].section_name, schedule: this.$refs.table[0].currentArray
         }
       )
      this.sections--        

      this.ukey()
      if (this.sections <= 0) {
        this.sub_instruction = false
        this.isTimeTableInputRequired = false
        this.isOtherClasses = false
        // console.log("done with all the sections")
        this.displayClashes()
      }
    }, 
    displayClashes() {
      this.calculateClashes()
      let lenghts = this.clashes.map((e) => e.length)
      let min_section = lenghts.indexOf(0) 

      this.isTimeTableInputRequired = true
      this.isTimeTableInputEnabled = false
      this.isLegendNeeded = true
        
      if (min_section >= 0) { // meaning there exists a section that has no clashses
        this.instruction = `Congrats! You have no clashes with ${this.otherClasses[min_section].name}`
        this.howManyTables = [{key: this.ukey(), other_section: this.otherClasses[min_section], myClasses: this.myClasses }]
      } else {
        this.displayAllResults()
      }
    },
    displayAllResults() {
      this.instruction = "Sorry, you have clashes with all the sections"
      this.sub_instruction = "Don't worry, they'll most likely make a repeater section"
      const allRes = []

      for (const [index, tables] of this.clashes.entries()) {
        allRes.push({ key: this.ukey(), other_section: this.otherClasses[index], myClasses: this.myClasses })
      }

      this.howManyTables = allRes
    },
    calculateClashes() {
      const all_my_classes = this.utils.flat2d(this.myClasses)
      const result = []

      for (const section of this.otherClasses) {
        const this_section_clashes = []
        const schedule = section.schedule
        const single_slots = []
        const double_slots = []
        for (const _class of schedule) {
          if (_class instanceof Array) {
            double_slots.push(_class)
          } else {
            single_slots.push(_class)
          }
        }

        // intersection of my single_slots classes and my classes
        let _intersection = this.utils.intersection(single_slots, all_my_classes)
        this.totalClashes += _intersection.length
        this_section_clashes.push(..._intersection)

        if (double_slots.length > 0) {
          for (const double_slot of double_slots) {
            _intersection = this.utils.intersection(double_slot, all_my_classes)
            this.totalClashes += _intersection.length
            if (_intersection.length > 0) {
              // push the entire double_slot
              // this_section_clashes.push(double_slot)
              this_section_clashes.push(..._intersection)
            }
          }
        }

        section.clash = this_section_clashes
        result.push(this_section_clashes)
      }
      this.clashes = result
    }
  } 
})

document.addEventListener('DOMContentLoaded', function () {
  var elems = document.querySelectorAll('.fixed-action-btn');
  var instances = M.FloatingActionButton.init(elems, {});
});