import baby from '../../data/디지몬/유아기.json' with { type: 'json' }
import child from '../../data/디지몬/유년기.json' with { type: 'json' }
import rookie from '../../data/디지몬/성장기.json' with { type: 'json' }
import champion from '../../data/디지몬/성숙기.json' with { type: 'json' }
import armor from '../../data/디지몬/아머체.json' with { type: 'json' }
import hybrid from '../../data/디지몬/하이브리드체.json' with { type: 'json' }
import ultimate from '../../data/디지몬/완전체.json' with { type: 'json' }
import mega from '../../data/디지몬/궁극체.json' with { type: 'json' }
import ultra from '../../data/디지몬/초궁극체.json' with { type: 'json' }

export const DIGIMON_STAGE_DATA = Object.freeze({
  유아기: baby, 유년기: child, 성장기: rookie, 성숙기: champion, 아머체: armor,
  하이브리드체: hybrid, 완전체: ultimate, 궁극체: mega, 초궁극체: ultra,
})
