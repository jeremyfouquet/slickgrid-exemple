import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { noop } from 'rxjs';
import { User } from 'src/app/models';
import { HomeService } from 'src/app/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public menuLinks: Array<any> = [

    {
      'url' : '/view/dashboard',
      'active': true,
      'srcActive': 'ansm_icons/Picto_tableau_de_bord.svg',
      'srcInactive': 'ansm_icons/Picto_tableau_de_bord.svg',
      'altText': '_Home_label_dashboards_',
      'label': '_Home_label_dashboards_',
      'roles': []
    },
    {
      'url' : '/view/dataEntry',
      'active': true,
      'srcActive': 'ansm_icons/Picto_saisie_donnees.svg',
      'srcInactive': 'ansm_icons/Picto_saisie_donnees.svg',
      'altText': '_Home_label_data_entry_',
      'label': '_Home_label_data_entry_',
      'roles': []

    },
    {
      'dropdown': true,
      'lblUrl': [
        {
          url: '/view/soldOut/create',
          lbl: '_Home_label_sold_out_create_'
        },
        {
          url: '/view/users',
          lbl: '_Home_label_user_update_'
        },
        {
          url: '/view/soldOut/update',
          lbl: '_Home_label_sold_out_update_'
        },
        {
          url: '/view/unit',
          lbl: '_Home_label_unit_'
        },
        {
          url: '/view/dataEntryTracking',
          lbl: '_Home_label_data_entry_tracking_'
        },
        {
          url: '/view/laboratoire',
          lbl: '_Home_label_data_laboratoire_'
        }
      ],
      'active': true,
      'srcActive': 'ansm_icons/Picto_modifier_session.svg',
      'srcInactive': 'ansm_icons/Picto_modifier_session.svg',
      'altText': '_Home_label_admin_',
      'label': '_Home_label_admin_',
      'roles': []
    }
  ];
  private _currentUser: User = new User();

  constructor(
    public home: HomeService,
    private router: Router
    ) {
      this._currentUser = require('src/app/mocks/userMocks.app.json');
     }

  ngOnInit() {
    this._checkRoles();
  }
  public onClick(link: any) {
    if (link.active === false) {
      return;
    } else {
      link.dropdown ? noop() : this.router.navigate([link.url]);
    }
  }
  private _checkRoles() {
    const newMenuLinks = [];
    this.menuLinks.forEach((element, i) => {
      const isValid = true;
      if (isValid && isValid === true) {
        newMenuLinks.push(element);
      }
    });
    this.menuLinks = newMenuLinks;
  }
}
