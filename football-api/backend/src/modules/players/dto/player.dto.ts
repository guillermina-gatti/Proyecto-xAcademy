import { Player } from '../entities/player.entity';

// Forma del jugador en el listado (no cambia respecto de commit 4).
export class PlayerDto {
  id: number;
  name: string;
  club: string;
  position: string;
  nationality: string;
  rating: number;
  speed: number;
  shooting: number;
  dribbling: number;
  passing: number;

  constructor(player: Player) {
    this.id = player.id;
    this.name = player.name;
    this.club = player.club;
    this.position = player.position;
    this.nationality = player.nationality;
    this.rating = player.rating;
    this.speed = player.speed;
    this.shooting = player.shooting;
    this.dribbling = player.dribbling;
    this.passing = player.passing;
  }
}
