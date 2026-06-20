import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SacredSearchBar
    extends StatefulWidget {

  final TextEditingController
  controller;

  final String hint;

  final VoidCallback? onTap;

  final Function(String)? onChanged;

  const SacredSearchBar({

    super.key,

    required this.controller,

    this.hint =
    'Summon knowledge nodes...',

    this.onTap,

    this.onChanged,
  });

  @override
  State<SacredSearchBar>
  createState() =>
      _SacredSearchBarState();
}

class _SacredSearchBarState
    extends State<SacredSearchBar>
    with
        SingleTickerProviderStateMixin {

  late AnimationController
  _controller;

  bool isFocused = false;

  @override
  void initState() {

    super.initState();

    _controller =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 2,
      ),
    )..repeat(
      reverse: true,
    );
  }

  @override
  void dispose() {

    _controller.dispose();

    super.dispose();
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    return AnimatedBuilder(

      animation: _controller,

      builder:
          (context, child) {

        final pulse =
        sin(
          _controller.value *
              2 *
              pi,
        );

        final glow =
        isFocused

            ? 0.20 +
            (pulse.abs() *
                0.14)

            : 0.06;

        return AnimatedContainer(

          duration:
          const Duration(
            milliseconds: 220,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              26,
            ),

            gradient:
            LinearGradient(

              begin:
              Alignment.topLeft,

              end:
              Alignment.bottomRight,

              colors: [

                Colors.white
                    .withValues(
                  alpha: 0.05,
                ),

                Colors.white
                    .withValues(
                  alpha: 0.02,
                ),
              ],
            ),

            border: Border.all(

              color:
              const Color(
                0xFFD4AF37,
              ).withValues(
                alpha:
                isFocused
                    ? 0.30
                    : 0.08,
              ),
            ),

            boxShadow: [

              BoxShadow(

                color:
                const Color(
                  0xFFD4AF37,
                ).withValues(
                  alpha: glow,
                ),

                blurRadius: 24,
                spreadRadius: 1,
              ),
            ],
          ),

          child: TextField(

            controller:
            widget.controller,

            onTap: () {

              setState(() {

                isFocused = true;
              });

              widget.onTap?.call();
            },

            onChanged:
            widget.onChanged,

            onTapOutside: (_) {

              setState(() {

                isFocused = false;
              });

              FocusScope.of(
                context,
              ).unfocus();
            },

            style:
            GoogleFonts.poppins(

              color: Colors.white,

              fontSize: 14,
            ),

            cursorColor:
            const Color(
              0xFFD4AF37,
            ),

            decoration:
            InputDecoration(

              border:
              InputBorder.none,

              contentPadding:
              const EdgeInsets.symmetric(

                horizontal: 22,
                vertical: 18,
              ),

              prefixIcon:
              Padding(

                padding:
                const EdgeInsets.only(
                  left: 16,
                  right: 10,
                ),

                child: Icon(

                  Icons.search_rounded,

                  color:
                  const Color(
                    0xFFD4AF37,
                  ),

                  size: 24,
                ),
              ),

              prefixIconConstraints:
              const BoxConstraints(

                minWidth: 54,
              ),

              suffixIcon:
              widget
                  .controller
                  .text
                  .isNotEmpty

                  ? GestureDetector(

                onTap: () {

                  widget
                      .controller
                      .clear();

                  setState(() {});
                },

                child: Icon(

                  Icons.close_rounded,

                  color:
                  Colors.white38,

                  size: 20,
                ),
              )

                  : null,

              hintText:
              widget.hint,

              hintStyle:
              GoogleFonts.poppins(

                color:
                Colors.white38,

                fontSize: 13,
              ),
            ),
          ),
        );
      },
    );
  }
}