-- 10/10/2026 — type de frein manquant au référentiel : frein moteur (E-ABS) avant + tambour arrière.
-- Sans lui, l'extracteur ne pouvait pas qualifier E-Twow GT et Micro Merlin (brake_type vide → modèles bloqués).
insert into public.fitment_brake_types (code, has_disc, has_drum, label_client, note)
values ('ebs_front_drum_rear', false, true, 'Frein moteur avant + tambour arrière', 'Aucun disque : E-ABS régénératif à l avant, tambour à l arrière. Typique E-Twow GT, Micro Merlin (ajout 10/10/2026)')
on conflict (code) do nothing;
