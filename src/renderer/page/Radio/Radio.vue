<template>
    <ListDetailLayout class="radio ncm-page">
        <mu-list slot="list">
            <ListItemBack></ListItemBack>
        </mu-list>
        <template slot="detail">
            <template v-if="user.loginValid">
                <div class="mu-card-media">
                    <div class="radio-header"></div>
                    <div class="mu-card-media-title">
                        <div class="mu-card-title">
                            <span>私人 FM</span>
                            <mu-switch :inputValue="ui.radioMode"
                                @change="handleActivate"
                                color="secondary"></mu-switch>
                        </div>
                        <div class="mu-card-sub-title">找到只属于你的频率</div>
                    </div>
                </div>
                <mu-sub-header>播放记录</mu-sub-header>
                <mu-divider></mu-divider>
                <RadioSongList :tracks="radio.list"
                    :source="trackSource"></RadioSongList>
            </template>
            <CenteredTip v-else
                icon="nature_people"
                tip="登录后开启私人 FM"></CenteredTip>
        </template>
    </ListDetailLayout>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import RadioSongList from './RadioSongList.vue';
import CenteredTip from '@/components/CenteredTip.vue';
import ListItemBack from '@/components/ListItemBack.vue';
import ListDetailLayout from '@/components/ListDetailLayout.vue';

const trackSource = { name: 'radio' };

export default {
    computed: {
        ...mapState(['ui', 'radio', 'user']),
        trackSource() { return trackSource; }
    },
    methods: {
        ...mapActions([
            'playAudio',
            'pauseAudio',
            'activateRadio',
            'updateUiLyric',
            'updateUiAudioSrc'
        ]),
        async handleActivate(val) {
            await this.activateRadio(val);
            this.updateUiLyric();
            await this.updateUiAudioSrc();
            if (val === true) {
                this.playAudio();
            } else {
                this.pauseAudio();
            }
        }
    },
    components: {
        RadioSongList,
        CenteredTip,
        ListItemBack,
        ListDetailLayout
    }
};
</script>

<style lang="less">
.radio {
    .radio-header {
        height: 200px;
        background: linear-gradient(45deg, #959ca6, #e1dfd2, #a59d97);
        background-position: 50%, 50%;
    }
    .mu-card-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .tracklist {
        .track-row {
            padding-left: 16px;
        }
    }
}
</style>
