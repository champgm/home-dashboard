<template>
  <div class="hello">
    <div v-if="lights.length < 1">
      <v-progress-circular :size="50" color="amber" indeterminate></v-progress-circular>
    </div>
    <div v-else>
      <v-container class="iconcontainer">
        <v-layout row justify-center wrap="" class="iconcontainer">
          <v-flex
            v-for="light in lights"
            v-if="lightReachable(light)"
            v-bind:key="light.id"
            class="buttonflex"
          >
            <LightButton :id="light.id" :stateAddress="stateAddress"></LightButton>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import LightButton from '@/components/LightButton.vue';
import { MyStore, Mutate, Get } from '@/store';
import { ILight } from 'node-hue-api';
import { byName } from '../util/Objects';

@Component({ components: { LightButton } })
export default class Lights extends Vue {
  private stateAddress = 'lights';
  get lights() {
    const lights = this.$store.getters[Get.lights];
    const sorted = Object.values(lights).sort(byName);
    return sorted;
  }
  public lightReachable(light: ILight): boolean {
    return light.state.reachable;
  }
}
</script>

<style scoped lang="scss">
.buttonflex {
  max-width: 105px;
  max-height: 155px;
}
.container {
  max-width: 600px;
}
</style>
