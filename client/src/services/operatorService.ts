import characterData from '../gamedata/character_table.json';

export interface Operator {
  id: string;
  name: string;
  rarity: number;
  profession: string;
  subProfession: string;
  position: string;
  description: string;
  tags: string[];
  nation: string;
  image?: string;
}

export interface CharacterData {
  name: string;
  description: string;
  rarity: string;
  profession: string;
  subProfessionId: string;
  position: string;
  tagList: string[];
  nationId: string;
  phases: any[];
  skills: any[];
  talents: any[];
}

class OperatorService {
  private operators: Operator[] = [];
  private initialized = false;

  constructor() {
    this.initializeOperators();
  }

  private initializeOperators() {
    if (this.initialized) return;

    this.operators = Object.entries(characterData).map(([id, data]: [string, any]) => {
      const rarityMap: { [key: string]: number } = {
        'TIER_1': 1,
        'TIER_2': 2,
        'TIER_3': 3,
        'TIER_4': 4,
        'TIER_5': 5,
        'TIER_6': 6
      };

      const professionMap: { [key: string]: string } = {
        'WARRIOR': '워리어',
        'SNIPER': '스나이퍼',
        'GUARD': '가드',
        'DEFENDER': '디펜더',
        'CASTER': '캐스터',
        'MEDIC': '메디컬',
        'SUPPORT': '서포터',
        'SPECIALIST': '스페셜리스트',
        'PIONEER': '파이오니어'
      };

      const positionMap: { [key: string]: string } = {
        'MELEE': '근접',
        'RANGED': '원거리'
      };

      return {
        id,
        name: data.name,
        rarity: rarityMap[data.rarity] || 3,
        profession: professionMap[data.profession] || data.profession,
        subProfession: data.subProfessionId || '',
        position: positionMap[data.position] || data.position,
        description: data.description || '',
        tags: data.tagList || [],
        nation: data.nationId || '',
        image: this.getOperatorImageUrl(id)
      };
    });

    this.initialized = true;
  }

  private getOperatorImageUrl(operatorId: string): string {
    // 실제 이미지 URL 생성 (게임 데이터에 따라 조정 필요)
    return `/api/operator-images/${operatorId}.png`;
  }

  public getAllOperators(): Operator[] {
    return [...this.operators];
  }

  public getOperatorsByRarity(rarity: number): Operator[] {
    return this.operators.filter(op => op.rarity === rarity && op.profession !== 'TOKEN');
  }

  public getOperatorsByProfession(profession: string): Operator[] {
    return this.operators.filter(op => op.profession === profession && op.profession !== 'TOKEN');
  }

  public getOperatorsByTags(tags: string[]): Operator[] {
    return this.operators.filter(op => 
      op.profession !== 'TOKEN' && 
      tags.some(tag => op.tags.includes(tag))
    );
  }

  public getOperatorById(id: string): Operator | undefined {
    return this.operators.find(op => op.id === id);
  }

  public getRandomOperators(count: number): Operator[] {
    const nonTokenOperators = this.operators.filter(op => op.profession !== 'TOKEN');
    const shuffled = [...nonTokenOperators].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  public getOperatorsForBanPick(): Operator[] {
    // 밴픽용 오퍼레이터 필터링 (3성 이상, TOKEN 제외)
    return this.operators.filter(op => 
      op.rarity >= 3 && 
      op.profession !== 'TOKEN'
    );
  }

  public searchOperators(query: string): Operator[] {
    const lowerQuery = query.toLowerCase();
    return this.operators.filter(op => 
      op.profession !== 'TOKEN' &&
      (op.name.toLowerCase().includes(lowerQuery) ||
       op.profession.toLowerCase().includes(lowerQuery) ||
       op.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  public getOperatorStats(): {
    total: number;
    byRarity: { [key: number]: number };
    byProfession: { [key: string]: number };
  } {
    const nonTokenOperators = this.operators.filter(op => op.profession !== 'TOKEN');
    
    const stats = {
      total: nonTokenOperators.length,
      byRarity: {} as { [key: number]: number },
      byProfession: {} as { [key: string]: number }
    };

    nonTokenOperators.forEach(op => {
      stats.byRarity[op.rarity] = (stats.byRarity[op.rarity] || 0) + 1;
      stats.byProfession[op.profession] = (stats.byProfession[op.profession] || 0) + 1;
    });

    return stats;
  }
}

// 싱글톤 인스턴스 생성
export const operatorService = new OperatorService();
export default operatorService;